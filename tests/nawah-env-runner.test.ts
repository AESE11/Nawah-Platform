import test from "node:test";
import assert from "node:assert/strict";

const prepareEnvironmentPromise = import("../scripts/with-nawah-env.mjs").then(
  ({ prepareEnvironment }) => prepareEnvironment as (input: {
    primaryContent: string;
    fallbackContents: string[];
    inheritedEnvironment: Record<string, string>;
    command: string;
  }) => Record<string, string>,
);

const validDatabaseUrl =
  "postgresql://postgres.izltqxnurilucfcwotfb:secret@pooler.example.test:5432/db";

async function prepare(
  primaryContent: string,
  inheritedEnvironment: Record<string, string> = {},
  command = "start",
) {
  return (await prepareEnvironmentPromise)({
    primaryContent,
    fallbackContents: [
      "DATABASE_URL=wrong\nNEXTAUTH_URL=https://wrong.example.test\nAUTH_URL=https://wrong.example.test\nFALLBACK_ONLY=secret",
    ],
    inheritedEnvironment,
    command,
  });
}

test("local environment file overrides inherited values and blocks fallback values", async () => {
  const environment = await prepare(
    `DATABASE_URL="${validDatabaseUrl}"\nDIRECT_URL="${validDatabaseUrl}"\nNEXTAUTH_URL=https://configured.example.test\nAPP_BASE_URL=http://localhost:3000`,
    {
      DATABASE_URL: "postgresql://wrong",
      NEXTAUTH_URL: "https://wrong.example.test",
      INHERITED_ONLY: "preserved",
    },
  );

  assert.equal(environment.DATABASE_URL, validDatabaseUrl);
  assert.equal(environment.DIRECT_URL, validDatabaseUrl);
  assert.equal(environment.NEXTAUTH_URL, "https://configured.example.test");
  assert.equal(environment.AUTH_URL, "");
  assert.equal(environment.FALLBACK_ONLY, "");
  assert.equal(environment.INHERITED_ONLY, "preserved");
});

test("development uses the local NextAuth URL without changing other modes", async () => {
  const content =
    `DATABASE_URL="${validDatabaseUrl}"\nDIRECT_URL="${validDatabaseUrl}"\nNEXTAUTH_URL=https://configured.example.test`;

  assert.equal(
    (await prepare(content, {}, "dev")).NEXTAUTH_URL,
    "http://localhost:3000",
  );
  assert.equal(
    (await prepare(content, {}, "start")).NEXTAUTH_URL,
    "https://configured.example.test",
  );
  assert.equal(
    (await prepare(content, {}, "start")).NAWAH_LOCAL_LOOPBACK_IP,
    "1",
  );
  assert.equal(
    (
      await prepare(
        content,
        { NODE_ENV: "production" },
        "start",
      )
    ).NAWAH_LOCAL_LOOPBACK_IP,
    "0",
  );
  assert.equal(
    (
      await prepare(
        content,
        { VERCEL: "1" },
        "start",
      )
    ).NAWAH_LOCAL_LOOPBACK_IP,
    "0",
  );
});

test("database URLs must exist and point to the expected Supabase project", async () => {
  await assert.rejects(
    prepare(`DIRECT_URL="${validDatabaseUrl}"`),
    /DATABASE_URL is missing/,
  );

  await assert.rejects(
    prepare(
      `DATABASE_URL="postgresql://user:secret@wrong.example.test/db"\nDIRECT_URL="${validDatabaseUrl}"`,
    ),
    /DATABASE_URL in \.env\.nawah does not reference the expected Supabase project/,
  );
});

test("production build and start do not substitute a development authentication URL", async () => {
  const content =
    `DATABASE_URL="${validDatabaseUrl}"\nDIRECT_URL="${validDatabaseUrl}"`;

  await assert.rejects(
    prepare(content, {}, "build"),
    /NEXTAUTH_URL is required in \.env\.nawah for build/,
  );
  await assert.rejects(
    prepare(content, {}, "start"),
    /NEXTAUTH_URL is required in \.env\.nawah for start/,
  );
});
