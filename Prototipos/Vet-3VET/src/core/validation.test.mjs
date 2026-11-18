import test from "node:test";
import assert from "node:assert/strict";
import { canReadOwner, csvCell, dateValue, integerValue, roleForEmail, textValue } from "./validation.mjs";

test("roles are assigned only from configured email allowlists", () => {
  assert.equal(roleForEmail("doctor@example.com", "doctor@example.com", ""), "admin");
  assert.equal(roleForEmail("dev@example.com", "", "dev@example.com"), "developer");
  assert.equal(roleForEmail("other@example.com", "doctor@example.com", "dev@example.com"), "client");
});
test("owner access is limited unless staff", () => { assert.equal(canReadOwner("client", "a", "a"), true); assert.equal(canReadOwner("client", "a", "b"), false); assert.equal(canReadOwner("admin", "a", "b"), true); });
test("server validation rejects invalid values", () => { assert.throws(() => textValue("", "Nombre")); assert.throws(() => integerValue(-2, "Stock")); assert.throws(() => dateValue("2026-02-31")); assert.equal(dateValue("2026-02-28"), "2026-02-28"); });
test("CSV cells neutralize spreadsheet formulas", () => { assert.equal(csvCell("=1+1"), '"\'=1+1"'); });
