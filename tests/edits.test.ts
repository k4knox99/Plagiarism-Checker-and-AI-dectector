import { test } from "node:test";
import assert from "node:assert/strict";
import { preservationWarnings } from "../server/edits.js";
test("preservation checks compare complete numeric tokens and retain quoted/cited terms", () => {
  assert.match(preservationWarnings("The event serves 12 people.", "The event serves 120 people.").join(" "), /numbers: 12/);
  assert.deepEqual(preservationWarnings('Keep 12 people and [1], “our words”, and Veritas.', 'Keep 12 people and [1], “our words”, and Veritas.', "Veritas"), []);
  const warnings = preservationWarnings('Keep 12 people and [1], “our words”, and Veritas.', 'Keep 120 people.', "Veritas");
  assert.equal(warnings.length, 4);
});
