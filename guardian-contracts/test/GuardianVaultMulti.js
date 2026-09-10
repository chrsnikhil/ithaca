const { expect } = require("chai");
const { ethers } = require("hardhat");

// Proves the multi-venue loop: invest across markets, rebalance between them, evacuate — all
// bounded by ONE Flex-signed Policy. Markets are 3 MockYieldVenues (stand-ins for Moonwell/
// Compound/Aave on testnet; graphscout's real mainnet read drives which one the agent picks).
describe("GuardianVaultMulti", () => {
  const U = 1_000_000n, u = (n) => n * U;

  async function deploy() {
    const [deployer, agent] = await ethers.getSigners();
    const owner = ethers.Wallet.createRandom().connect(ethers.provider);
    await deployer.sendTransaction({ to: owner.address, value: ethers.parseEther("1") });

    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const MYV = await ethers.getContractFactory("MockYieldVenue");
    const m1 = await MYV.deploy(await usdc.getAddress(), 400); // "Moonwell" 4%
    const m2 = await MYV.deploy(await usdc.getAddress(), 600); // "Compound" 6%
    const m3 = await MYV.deploy(await usdc.getAddress(), 500); // "Aave" 5%
    const venues = [await m1.getAddress(), await m2.getAddress(), await m3.getAddress()];

    const haven = ethers.Wallet.createRandom().address;
    const vault = await (await ethers.getContractFactory("GuardianVaultMulti"))
      .deploy(owner.address, await usdc.getAddress(), venues, venues, agent.address, haven);

    await usdc.mint(deployer.address, u(2000n));
    await usdc.approve(await vault.getAddress(), u(1000n));
    await vault.deposit(u(1000n));
    for (const v of venues) { await usdc.approve(v, u(10n)); await (await ethers.getContractAt("MockYieldVenue", v)).fundYieldBuffer(u(10n)); }

    return { vault, usdc, agent, owner, haven, venues };
  }

  function policy(safeHaven, over = {}) {
    return { investCap: u(1000n), protectCap: u(1000n), safeHaven, expiry: 2000000000n, nonce: 1n, ...over };
  }
  async function sign(vaultAddr, signer, p) {
    const domain = { name: "Guardian", version: "1", chainId: 31337, verifyingContract: vaultAddr };
    const types = { Policy: [
      { name: "investCap", type: "uint256" }, { name: "protectCap", type: "uint256" },
      { name: "safeHaven", type: "address" }, { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
    ] };
    return signer.signTypedData(domain, types, p);
  }

  it("invests across two markets, capped by the total investCap", async () => {
    const { vault, agent, owner, haven, venues } = await deploy();
    const p = policy(haven); const sig = await sign(await vault.getAddress(), owner, p);
    await vault.connect(agent).invest(p, sig, venues[0], u(300n));
    await vault.connect(agent).invest(p, sig, venues[1], u(400n));
    expect(await vault.positionOf(venues[0])).to.be.closeTo(u(300n), 1000n);
    expect(await vault.positionOf(venues[1])).to.be.closeTo(u(400n), 1000n);
    expect(await vault.totalPosition()).to.be.closeTo(u(700n), 2000n);
    expect(await vault.idle()).to.equal(u(300n));
  });

  it("rebalances a position from one market to another (the graphscout-driven switch)", async () => {
    const { vault, agent, owner, haven, venues } = await deploy();
    const p = policy(haven); const sig = await sign(await vault.getAddress(), owner, p);
    await vault.connect(agent).invest(p, sig, venues[0], u(500n));
    await vault.connect(agent).rebalance(venues[0], venues[1], u(500n));
    expect(await vault.positionOf(venues[0])).to.be.lt(u(1n));
    expect(await vault.positionOf(venues[1])).to.be.closeTo(u(500n), 1000n);
  });

  it("protects to the safe haven, auto-pulling from the markets", async () => {
    const { vault, usdc, agent, owner, haven, venues } = await deploy();
    const p = policy(haven); const sig = await sign(await vault.getAddress(), owner, p);
    await vault.connect(agent).invest(p, sig, venues[0], u(400n));
    await vault.connect(agent).invest(p, sig, venues[1], u(400n)); // idle 200, positions 400+400
    await vault.connect(agent).protect(p, sig, u(700n));
    expect(await usdc.balanceOf(haven)).to.equal(u(700n));
  });

  it("REVERTS investing beyond the total cap and into a non-allowlisted venue", async () => {
    const { vault, agent, owner, haven, venues } = await deploy();
    const p = policy(haven, { investCap: u(500n) }); const sig = await sign(await vault.getAddress(), owner, p);
    await expect(vault.connect(agent).invest(p, sig, venues[0], u(501n))).to.be.revertedWithCustomError(vault, "OverInvestCap");
    const evil = ethers.Wallet.createRandom().address;
    await expect(vault.connect(agent).invest(p, sig, evil, u(1n))).to.be.revertedWithCustomError(vault, "BadVenue");
  });

  async function signEscalation(vaultAddr, signer, e) {
    const domain = { name: "Guardian", version: "1", chainId: 31337, verifyingContract: vaultAddr };
    const types = { Escalation: [
      { name: "amount", type: "uint256" }, { name: "safeHaven", type: "address" },
      { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
    ] };
    return signer.signTypedData(domain, types, e);
  }

  it("HIGH-RISK: approveAndProtect evacuates to a FRESH haven on a single-use Flex approval", async () => {
    const { vault, usdc, agent, owner, venues } = await deploy();
    const p = policy(ethers.Wallet.createRandom().address);
    const sig = await sign(await vault.getAddress(), owner, p);
    await vault.connect(agent).invest(p, sig, venues[0], u(500n)); // 500 in a venue, 500 idle
    const freshHaven = ethers.Wallet.createRandom().address; // NOT on the standing allowlist
    const e = { amount: u(500n), safeHaven: freshHaven, expiry: 2000000000n, nonce: 42n };
    const esig = await signEscalation(await vault.getAddress(), owner, e);
    await vault.connect(agent).approveAndProtect(e, esig, u(300n));
    expect(await usdc.balanceOf(freshHaven)).to.equal(u(300n));
    // single-use: the same approval can't be replayed
    await expect(vault.connect(agent).approveAndProtect(e, esig, u(100n)))
      .to.be.revertedWithCustomError(vault, "EscalationUsed");
  });

  it("HIGH-RISK: rejects an escalation not signed by the Flex, and over its approved amount", async () => {
    const { vault, agent, owner, venues } = await deploy();
    const p = policy(ethers.Wallet.createRandom().address);
    const sig = await sign(await vault.getAddress(), owner, p);
    await vault.connect(agent).invest(p, sig, venues[0], u(500n));
    const freshHaven = ethers.Wallet.createRandom().address;
    const e = { amount: u(200n), safeHaven: freshHaven, expiry: 2000000000n, nonce: 7n };
    // wrong signer
    const badSig = await signEscalation(await vault.getAddress(), ethers.Wallet.createRandom(), e);
    await expect(vault.connect(agent).approveAndProtect(e, badSig, u(100n)))
      .to.be.revertedWithCustomError(vault, "BadPolicySigner");
    // over the approved amount
    const okSig = await signEscalation(await vault.getAddress(), owner, e);
    await expect(vault.connect(agent).approveAndProtect(e, okSig, u(201n)))
      .to.be.revertedWithCustomError(vault, "OverProtectCap");
  });
});
