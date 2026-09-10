const { ethers } = require("ethers");
(async () => {
  const addr = "0x975Bb943F18fe44333eF28D18865ca5A5D63c23D";
  const usdcAddr = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Circle USDC on Base Sepolia
  const rpcs = ["https://sepolia.base.org", "https://base-sepolia-rpc.publicnode.com"];
  for (const rpc of rpcs) {
    try {
      const p = new ethers.JsonRpcProvider(rpc);
      const eth = await p.getBalance(addr);
      const usdc = new ethers.Contract(usdcAddr, ["function balanceOf(address) view returns (uint256)"], p);
      const bal = await usdc.balanceOf(addr);
      console.log(`RPC ${rpc}`);
      console.log(`  ETH : ${ethers.formatEther(eth)}`);
      console.log(`  USDC: ${ethers.formatUnits(bal, 6)}`);
      return;
    } catch (e) {
      console.log(`RPC ${rpc} failed: ${e.message.slice(0, 80)}`);
    }
  }
})();
