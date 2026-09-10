// Seal a secret into a LOCAL encrypted blob (dev/demo backend).
//   echo "0xPRIVATEKEY" | node src/seal.js agent-key.json "my-passphrase"
//
// For the PRODUCTION Ledger Key Ring backend, don't use this — seal with the device instead:
//   printf '0xPRIVATEKEY' > k.txt
//   wallet-cli ring encrypt -i k.txt -o agent-key.enc --key guardian-agent
//   rm k.txt
const fs = require("fs");
const { localEncrypt } = require("./secret-store");

const [, , out, pass] = process.argv;
if (!out || !pass) {
  console.error('usage: echo "<secret>" | node src/seal.js <outfile.json> <passphrase>');
  process.exit(1);
}
let secret = "";
process.stdin.on("data", (d) => (secret += d));
process.stdin.on("end", () => {
  fs.writeFileSync(out, JSON.stringify(localEncrypt(secret.trim(), pass), null, 2));
  console.log("sealed ->", out, "(local AES-256-GCM). The plaintext is not stored.");
});
