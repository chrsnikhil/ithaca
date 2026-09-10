const { test } = require("node:test");
const assert = require("node:assert");
const { assessRisk } = require("../risk");

test("safe portfolio -> no danger", () => {
  const r = assessRisk({ positions: [{ symbol: "USDC", isStable: true, price: 1.0 }], healthFactor: 2.0 });
  assert.equal(r.danger, false);
  assert.equal(r.severity, 0);
});

test("stablecoin depeg -> danger", () => {
  const r = assessRisk({ positions: [{ symbol: "USDC", isStable: true, price: 0.97 }] });
  assert.equal(r.danger, true);
  assert.ok(r.reasons[0].includes("depeg"));
  assert.equal(r.severity, 3);
});

test("drawdown over threshold -> danger", () => {
  const r = assessRisk({ positions: [{ symbol: "ETH", drawdownPct: 0.08 }] });
  assert.equal(r.danger, true);
  assert.ok(r.reasons[0].includes("drawdown"));
});

test("low health factor -> danger (highest severity)", () => {
  const r = assessRisk({ positions: [], healthFactor: 1.02 });
  assert.equal(r.danger, true);
  assert.equal(r.severity, 4);
});

test("tiny depeg within tolerance -> safe", () => {
  const r = assessRisk({ positions: [{ symbol: "USDC", isStable: true, price: 0.999 }] });
  assert.equal(r.danger, false);
});
