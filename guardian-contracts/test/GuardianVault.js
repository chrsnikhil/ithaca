const { expect } = require("chai");
const { ethers } = require("hardhat");

// The owner wallet stands in for the Ledger Flex (same EIP-712 signature the DMK produces on-device).
describe("GuardianVault", () => {
  const USDC = 1_000_000n; // 1 USDC = 1e6
  const u = (n) => n * USDC;

  async function deploy() {
    const [deployer, agent, attacker] = await ethers.getSigners();
    const owner = ethers.Wallet.createRandom().connect(ethers.provider);
    await deployer.sendTransaction({ to: owner.address, value: ethers.parseEther("1") });

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    const MockAavePool = await ethers.getContractFactory("MockAavePool");
    const pool = await MockAavePool.deploy(await usdc.getAddress());
    const aToken = await pool.aToken();

    // agent + safe haven are set at construction (owner can change them later via setters)
    const safeHaven = ethers.Wallet.createRandom().address;
    const GuardianVault = await ethers.getContractFactory("GuardianVault");
    const vault = await GuardianVault.deploy(owner.address, await usdc.getAddress(), await pool.getAddress(), aToken, agent.address, safeHaven);

    // fund the vault with 1000 USDC
    await usdc.mint(deployer.address, u(1000n));
    await usdc.approve(await vault.getAddress(), u(1000n));
    await vault.deposit(u(1000n));

    return { vault, usdc, pool, owner, agent, attacker, safeHaven };
  }

  async function signPolicy(vaultAddr, signer, p) {
    const domain = { name: "Guardian", version: "1", chainId: 31337, verifyingContract: vaultAddr };
    const types = {
      Policy: [
        { name: "investCap", type: "uint256" },
        { name: "venue", type: "address" },
        { name: "protectCap", type: "uint256" },
        { name: "safeHaven", type: "address" },
        { name: "expiry", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    };
    return signer.signTypedData(domain, types, p);
  }

  async function policyFor(vault, pool, safeHaven, over = {}) {
    return {
      investCap: u(1000n),
      venue: await pool.getAddress(),
      protectCap: u(1000n),
      safeHaven,
      expiry: 2000000000n,
      nonce: 1n,
      ...over,
    };
  }

  it("invests idle USDC into the venue within the signed cap", async () => {
    const { vault, pool, owner, agent, safeHaven } = await deploy();
    const p = await policyFor(vault, pool, safeHaven);
    const sig = await signPolicy(await vault.getAddress(), owner, p);

    await vault.connect(agent).invest(p, sig, u(600n));
    expect(await vault.position()).to.equal(u(600n));
    expect(await vault.idle()).to.equal(u(400n));

    // second invest within the remaining cap is allowed (autonomy within bounds)
    await vault.connect(agent).invest(p, sig, u(400n));
    expect(await vault.position()).to.equal(u(1000n));
  });

  it("de-risks the position back into the vault (funds stay under owner control)", async () => {
    const { vault, pool, owner, agent, safeHaven } = await deploy();
    const p = await policyFor(vault, pool, safeHaven);
    const sig = await signPolicy(await vault.getAddress(), owner, p);

    await vault.connect(agent).invest(p, sig, u(600n));
    await vault.connect(agent).deRisk(u(200n));
    expect(await vault.position()).to.equal(u(400n));
    expect(await vault.idle()).to.equal(u(600n));
  });

  it("protects to the safe haven, pulling from the venue when idle is short", async () => {
    const { vault, usdc, pool, owner, agent, safeHaven } = await deploy();
    const p = await policyFor(vault, pool, safeHaven);
    const sig = await signPolicy(await vault.getAddress(), owner, p);

    await vault.connect(agent).invest(p, sig, u(1000n)); // idle 0, position 1000
    await vault.connect(agent).protect(p, sig, u(300n));
    expect(await usdc.balanceOf(safeHaven)).to.equal(u(300n));
    expect(await vault.position()).to.equal(u(700n));

    // cumulative protect within cap is allowed
    await vault.connect(agent).protect(p, sig, u(200n));
    expect(await usdc.balanceOf(safeHaven)).to.equal(u(500n));
  });

  it("REVERTS when invest exceeds the investCap", async () => {
    const { vault, pool, owner, agent, safeHaven } = await deploy();
    const p = await policyFor(vault, pool, safeHaven, { investCap: u(500n) });
    const sig = await signPolicy(await vault.getAddress(), owner, p);
    await expect(vault.connect(agent).invest(p, sig, u(501n)))
      .to.be.revertedWithCustomError(vault, "OverInvestCap");
  });

  it("REVERTS when protect exceeds the protectCap", async () => {
    const { vault, pool, owner, agent, safeHaven } = await deploy();
    const p = await policyFor(vault, pool, safeHaven, { protectCap: u(400n) });
    const sig = await signPolicy(await vault.getAddress(), owner, p);
    await vault.connect(agent).invest(p, sig, u(1000n));
    await expect(vault.connect(agent).protect(p, sig, u(401n)))
      .to.be.revertedWithCustomError(vault, "OverProtectCap");
  });

  it("REVERTS when the policy is signed by someone other than the owner (Ledger)", async () => {
    const { vault, pool, agent, attacker, safeHaven } = await deploy();
    const p = await policyFor(vault, pool, safeHaven);
    const sig = await signPolicy(await vault.getAddress(), attacker, p); // NOT the Ledger
    await expect(vault.connect(agent).invest(p, sig, u(100n)))
      .to.be.revertedWithCustomError(vault, "BadPolicySigner");
  });

  it("REVERTS when the policy venue is not the approved venue", async () => {
    const { vault, pool, owner, agent, safeHaven } = await deploy();
    const evilVenue = ethers.Wallet.createRandom().address;
    const p = await policyFor(vault, pool, safeHaven, { venue: evilVenue });
    const sig = await signPolicy(await vault.getAddress(), owner, p);
    await expect(vault.connect(agent).invest(p, sig, u(100n)))
      .to.be.revertedWithCustomError(vault, "BadVenue");
  });

  it("REVERTS when protect targets a non-approved safe haven", async () => {
    const { vault, pool, owner, agent } = await deploy();
    const evilHaven = ethers.Wallet.createRandom().address;
    const p = await policyFor(vault, pool, evilHaven);
    const sig = await signPolicy(await vault.getAddress(), owner, p);
    await expect(vault.connect(agent).protect(p, sig, u(100n)))
      .to.be.revertedWithCustomError(vault, "SafeHavenNotAllowed");
  });

  it("REVERTS when a non-agent tries to trigger the loop", async () => {
    const { vault, pool, owner, attacker, safeHaven } = await deploy();
    const p = await policyFor(vault, pool, safeHaven);
    const sig = await signPolicy(await vault.getAddress(), owner, p);
    await expect(vault.connect(attacker).invest(p, sig, u(100n)))
      .to.be.revertedWithCustomError(vault, "NotAgent");
    await expect(vault.connect(attacker).deRisk(u(100n)))
      .to.be.revertedWithCustomError(vault, "NotAgent");
  });
});
