import test from "node:test";
import assert from "node:assert/strict";
import type { RequestInternal } from "next-auth";

import { authOptions } from "../lib/auth";
import { POST as mobileLogin } from "../app/api/mobile/auth/login/route";

function setMissingIpEnvironment(t: test.TestContext) {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    localLoopback: process.env.NAWAH_LOCAL_LOOPBACK_IP,
  };

  Reflect.set(process.env, "NODE_ENV", "production");
  Reflect.deleteProperty(process.env, "VERCEL");
  Reflect.set(process.env, "NAWAH_LOCAL_LOOPBACK_IP", "0");

  t.after(() => {
    if (previous.nodeEnv === undefined) {
      Reflect.deleteProperty(process.env, "NODE_ENV");
    } else {
      Reflect.set(process.env, "NODE_ENV", previous.nodeEnv);
    }

    if (previous.vercel === undefined) {
      Reflect.deleteProperty(process.env, "VERCEL");
    } else {
      Reflect.set(process.env, "VERCEL", previous.vercel);
    }

    if (previous.localLoopback === undefined) {
      Reflect.deleteProperty(process.env, "NAWAH_LOCAL_LOOPBACK_IP");
    } else {
      Reflect.set(
        process.env,
        "NAWAH_LOCAL_LOOPBACK_IP",
        previous.localLoopback,
      );
    }
  });
}

function captureConsoleErrors(t: test.TestContext) {
  const messages: string[] = [];
  t.mock.method(console, "error", (...args: unknown[]) => {
    messages.push(args.map(String).join(" "));
  });
  return messages;
}

test("web login rejects missing trusted IP before calling the rate limiter", async (t) => {
  setMissingIpEnvironment(t);
  const errors = captureConsoleErrors(t);
  const credentialsProvider = authOptions.providers.find(
    (provider) => provider.type === "credentials",
  );

  assert.ok(credentialsProvider?.authorize);

  const request: RequestInternal = {
    action: "signin",
    headers: {},
  };
  const authorize = credentialsProvider.options?.authorize;
  assert.ok(authorize);

  const result = await authorize(
    { email: "student@example.com", password: "test-password" },
    request,
  );

  assert.equal(result, null);
  assert.deepEqual(errors, [
    "Web login unavailable: trusted client IP missing.",
  ]);
});

test("mobile login rejects missing trusted IP before calling the rate limiter", async (t) => {
  setMissingIpEnvironment(t);
  const errors = captureConsoleErrors(t);

  const response = await mobileLogin(
    new Request("http://localhost/api/mobile/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "student@example.com",
        password: "test-password",
      }),
    }),
  );

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    message: "Login is temporarily unavailable.",
  });
  assert.deepEqual(errors, [
    "Mobile login unavailable: trusted client IP missing.",
  ]);
});
