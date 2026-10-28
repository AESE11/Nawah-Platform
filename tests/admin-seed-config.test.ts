import test from "node:test";
import assert from "node:assert/strict";

import { getAdminSeedCredentials } from "../lib/security/admin-seed-config";

test("admin bootstrap requires explicit non-placeholder credentials", () => {
  assert.throws(
    () => getAdminSeedCredentials({}),
    /Set a non-placeholder ADMIN_EMAIL/,
  );
  assert.throws(
    () =>
      getAdminSeedCredentials({
        ADMIN_EMAIL: "admin@example.com",
        ADMIN_PASSWORD: "your-admin-password",
      }),
    /Set a non-placeholder ADMIN_EMAIL/,
  );
  assert.throws(
    () =>
      getAdminSeedCredentials({
        ADMIN_EMAIL: "owner@example.org",
        ADMIN_PASSWORD: "short",
      }),
    /at least 12 characters/,
  );
});

test("admin bootstrap returns explicitly configured credentials", () => {
  assert.deepEqual(
    getAdminSeedCredentials({
      ADMIN_EMAIL: " owner@example.org ",
      ADMIN_PASSWORD: "StrongTestPassword123",
    }),
    {
      email: "owner@example.org",
      password: "StrongTestPassword123",
    },
  );
});
