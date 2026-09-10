/**
 * End-to-end exercise of the intelligence layer against LIVE subgraphs.
 *   GRAPH_API_KEY=xxxx npx tsx src/test-intel.ts
 */
import { understandProtocol, assessRisk, getProtocolHealth, compareProtocols } from "./intel.js";

const log = (...a: unknown[]) => console.error(...a);
const show = (label: string, obj: unknown) => { log(`\n===== ${label} =====`); log(JSON.stringify(obj, null, 2)); };

async function main() {
  show("understand_protocol('aave')", await understandProtocol("aave"));
  show("get_protocol_health('aave')", await getProtocolHealth("aave"));
  show("assess_risk('aave')", await assessRisk("aave"));
  show("compare_protocols(['aave','compound'])", await compareProtocols(["aave", "compound"]));
  process.exit(0);
}
main().catch((e) => { log("TEST FAILED:", e); process.exit(1); });
