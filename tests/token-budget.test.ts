import { test } from "node:test";
import assert from "node:assert/strict";
import { outputBudget } from "../server/token-budget.js";
test("short edits receive smaller budgets while non-Latin full edits retain more room", () => {
  assert.ok(outputBudget("A short clear sentence.", "rewrite") < outputBudget("word ".repeat(1500), "rewrite"));
  assert.ok(outputBudget("က".repeat(3000), "rewrite") > outputBudget("a".repeat(3000), "rewrite"));
  assert.ok(outputBudget("a".repeat(15000), "summary") < outputBudget("a".repeat(15000), "rewrite"));
  for (const task of ["rewrite","proofread","summary","signals","sources"] as const)
    assert.ok(Number.isSafeInteger(outputBudget("က".repeat(15000),task)) && outputBudget("က".repeat(15000),task) <= 8192);
});
