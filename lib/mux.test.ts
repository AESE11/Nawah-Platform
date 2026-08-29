import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getMuxConfig, generateMuxPlaybackToken } from "./mux";

describe("Mux server utilities", () => {
  it("throws when required signing configuration is missing", () => {
    const original = {
      MUX_SIGNING_KEY: process.env.MUX_SIGNING_KEY,
      MUX_PRIVATE_KEY: process.env.MUX_PRIVATE_KEY,
    };

    delete process.env.MUX_SIGNING_KEY;
    delete process.env.MUX_PRIVATE_KEY;

    assert.throws(() => getMuxConfig(), /MUX_SIGNING_KEY|MUX_PRIVATE_KEY/i);

    Object.assign(process.env, original);
  });

  it("rejects invalid playback ids", async () => {
    const original = {
      MUX_SIGNING_KEY: process.env.MUX_SIGNING_KEY,
      MUX_PRIVATE_KEY: process.env.MUX_PRIVATE_KEY,
      MUX_SIGNING_SECRET: process.env.MUX_SIGNING_SECRET,
    };

    process.env.MUX_SIGNING_KEY = "test-signing-key";
    process.env.MUX_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----";

    await assert.rejects(generateMuxPlaybackToken(""), /playback ID|playbackId/i);
    await assert.rejects(generateMuxPlaybackToken("   "), /playback ID|playbackId/i);

    Object.assign(process.env, original);
  });
});
