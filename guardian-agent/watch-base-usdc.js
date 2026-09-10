const { ethers } = require("ethers");
(async () => {
  const addr = "0x975Bb943F18fe44333eF28D18865ca5A5D63c23D";
  const usdcAddr = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const p = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const usdc = new ethers.Contract(usdcAddr, ["function balanceOf(address) view returns (uint256)"], p);
  for (let i = 0; i < 180; i++) {
    try {
      const b = await usdc.balanceOf(addr);
      if (b > 0n) { console.log("USDC FUNDED:", ethers.formatUnits(b, 6)); return; }
    } catch {}
    await new Promise((r) => setTimeout(r, 10000));
  }
  console.log("no USDC after watch window — re-run once you've hit the faucet");
})();
