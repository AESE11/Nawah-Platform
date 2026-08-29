import test from "node:test";
import assert from "node:assert/strict";

import { canAccessAdminArea, isAdminSession } from "../lib/admin-guard";

test("only admin session can access admin area", () => {
  assert.equal(isAdminSession({ user: { role: "ADMIN" } }), true);
  assert.equal(isAdminSession({ user: { role: "STUDENT" } }), false);
  assert.equal(isAdminSession(null), false);
  assert.equal(canAccessAdminArea({ user: { role: "ADMIN" } }), true);
  assert.equal(canAccessAdminArea({ user: { role: "STUDENT" } }), false);
});
