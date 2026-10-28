import test from "node:test";
import assert from "node:assert/strict";

import { getClientIpFromHeaders } from "../lib/security/client-ip";

test("local development uses loopback instead of trusting client headers", () => {
  const headers = new Headers({
    "x-forwarded-for": "198.51.100.27",
    "x-real-ip": "198.51.100.28",
    "x-vercel-forwarded-for": "198.51.100.29",
  });

  assert.equal(
    getClientIpFromHeaders(headers, {
      NODE_ENV: "development",
      VERCEL: undefined,
      NAWAH_LOCAL_LOOPBACK_IP: "0",
    }),
    "127.0.0.1",
  );
});

test("local production start uses loopback only when the wrapper opts in", () => {
  const headers = new Headers({
    "x-forwarded-for": "198.51.100.27",
  });

  assert.equal(
    getClientIpFromHeaders(headers, {
      NODE_ENV: "production",
      VERCEL: undefined,
      NAWAH_LOCAL_LOOPBACK_IP: "1",
    }),
    "127.0.0.1",
  );
  assert.equal(
    getClientIpFromHeaders(headers, {
      NODE_ENV: "production",
      VERCEL: undefined,
      NAWAH_LOCAL_LOOPBACK_IP: "0",
    }),
    null,
  );
});

test("production ignores untrusted forwarding headers and fails closed without a trusted proxy IP", () => {
  const headers = new Headers({
    "x-forwarded-for": "198.51.100.27",
    "x-real-ip": "198.51.100.28",
    forwarded: "for=198.51.100.29",
    "x-vercel-forwarded-for": "198.51.100.30",
  });

  assert.equal(
    getClientIpFromHeaders(headers, {
      NODE_ENV: "production",
      VERCEL: undefined,
      NAWAH_LOCAL_LOOPBACK_IP: "0",
    }),
    null,
  );
});

test("Vercel client IP is read only from its platform header", () => {
  const platformHeaders = new Headers({
    "x-forwarded-for": "198.51.100.27",
    "x-vercel-forwarded-for": "203.0.113.42, 10.0.0.1",
  });
  const fakeHeaders = new Headers({
    "x-forwarded-for": "198.51.100.27",
  });
  const runtime = {
    NODE_ENV: "production",
    VERCEL: "1",
    NAWAH_LOCAL_LOOPBACK_IP: "1",
  } as const;

  assert.equal(
    getClientIpFromHeaders(platformHeaders, runtime),
    "203.0.113.42",
  );
  assert.equal(getClientIpFromHeaders(fakeHeaders, runtime), null);
});

test("missing headers and non-Vercel production have no trusted client IP", () => {
  assert.equal(
    getClientIpFromHeaders(undefined, {
      NODE_ENV: "production",
      VERCEL: undefined,
      NAWAH_LOCAL_LOOPBACK_IP: "0",
    }),
    null,
  );
});
