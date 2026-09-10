const { expect } = require("chai");
const { ethers } = require("hardhat");

// Proves the SAME GuardianVault runs the full invest -> accrue-yield -> de-risk -> protect loop
// through the Arc-native MockYieldVenue (the testnet stand-in for the USYC Teller), so the Arc
// deploy is de-risked before we spend any Arc gas.
describe("GuardianVault on Arc (MockYieldVenue)", () => {
  const U = 1_000_000n;
  const u = (n) => n * U;

  async function deploy() {
    const [deployer, agent] = await ethers.getSigners();
    const owner = ethers.Wallet.createRandom().connect(ethers.provider);
    await deployer.sendTransaction({ to: owner.address, value: ethers.parseEther("1") });

    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const venue = await (await ethers.getContractFactory("MockYieldVenue")).deploy(await usdc.getAddress(), 500); // 5% APR
    const venueAddr = await venue.getAddress();

    const safeHaven = ethers.Wallet.createRandom().address;
    const vault = await (await ethers.getContractFactory("GuardianVault"))
      .deploy(owner.address, await usdc.getAddress(), venueAddr, venueAddr, agent.address, safeHaven);

    await usdc.mint(deployer.address, u(2000n));
    await usdc.approve(await vault.getAddress(), u(1000n));
    await vault.deposit(u(1000n));
    // seed the venue's yield buffer so accrued yield is actually payable on withdraw
    await usdc.approve(venueAddr, u(100n));
    await venue.fundYieldBuffer(u(100n));

    return { vault, usdc, venue, venueAddr, owner, agent, safeHaven };
  }

  function policyFor(venueAddr, safeHaven, over = {}) {
    return { investCap: u(1000n), venue: venueAddr, protectCap: u(1000n), safeHaven, expiry: 2000000000n, nonce: 1n, ...over };
  }
  async function signPolicy(vaultAddr, signer, p) {
    const domain = { name: "Guardian", version: "1", chainId: 31337, verifyingContract: vaultAddr };
    const types = { Policy: [
      { name: "investCap", type: "uint256" }, { name: "venue", type: "address" },
      { name: "protectCap", type: "uint256" }, { name: "safeHaven", type: "address" },
      { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" },
    ] };
    return signer.signTypedData(domain, types, p);
  }

  it("invests, accrues yield over time, de-risks, and protects through the Arc venue", async () => {
    const { vault, usdc, venueAddr, owner, agent, safeHaven } = await deploy();
    const p = policyFor(venueAddr, safeHaven);
    const sig = await signPolicy(await vault.getAddress(), owner, p);

    await vault.connect(agent).invest(p, sig, u(1000n));
    const pos0 = await vault.position();
    expect(pos0).to.be.closeTo(u(1000n), 1000n); // ~1000 at deposit
    expect(await vault.idle()).to.equal(0n);

    // advance ~30 days -> the position should visibly earn yield
    await ethers.provider.send("evm_increaseTime", [30 * 24 * 3600]);
    await ethers.provider.send("evm_mine", []);
    const pos1 = await vault.position();
    expect(pos1).to.be.gt(pos0); // yield accrued

    // elevated -> pull some back into the vault
    await vault.connect(agent).deRisk(u(200n));
    expect(await vault.idle()).to.equal(u(200n));

    // danger -> evacuate to the safe haven (uses idle first, then pulls from the venue)
    await vault.connect(agent).protect(p, sig, u(300n));
    expect(await usdc.balanceOf(safeHaven)).to.equal(u(300n));
  });

  it("still enforces the invest cap on the Arc venue", async () => {
    const { vault, venueAddr, owner, agent, safeHaven } = await deploy();
    const p = policyFor(venueAddr, safeHaven, { investCap: u(500n) });
    const sig = await signPolicy(await vault.getAddress(), owner, p);
    await expect(vault.connect(agent).invest(p, sig, u(501n)))
      .to.be.revertedWithCustomError(vault, "OverInvestCap");
  });
});
