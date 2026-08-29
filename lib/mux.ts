import Mux from "@mux/mux-node";

export const DEFAULT_MUX_PLAYBACK_TOKEN_TTL = "1h";

export function getMuxPlaybackTokenTtl() {
  return process.env.MUX_PLAYBACK_TOKEN_TTL?.trim() || DEFAULT_MUX_PLAYBACK_TOKEN_TTL;
}

export function getMuxPlaybackTokenLifetimeMs(ttl: string = getMuxPlaybackTokenTtl()) {
  const match = ttl.trim().match(/^([0-9]+)([smhd])$/i);

  if (!match) {
    return 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === "s") return value * 1000;
  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  if (unit === "d") return value * 24 * 60 * 60 * 1000;

  return 60 * 60 * 1000;
}

export interface MuxServerConfig {
  signingKey: string;
  privateKey: string;
  tokenId?: string;
  tokenSecret?: string;
}

export interface GenerateMuxPlaybackTokenOptions {
  expiration?: string;
}

export function normalizePlaybackId(playbackId: string): string {
  const normalizedPlaybackId = playbackId?.trim();

  if (!normalizedPlaybackId || !/^[A-Za-z0-9_-]+$/.test(normalizedPlaybackId)) {
    throw new Error("A valid Mux playback ID is required.");
  }

  return normalizedPlaybackId;
}

export function getMuxConfig(): MuxServerConfig {
  const signingKey = process.env.MUX_SIGNING_KEY?.trim();
  const privateKey = process.env.MUX_PRIVATE_KEY?.trim();

  if (!signingKey || !privateKey) {
    throw new Error(
      "Missing Mux signing configuration. Set MUX_SIGNING_KEY and MUX_PRIVATE_KEY in the server environment before generating signed playback tokens.",
    );
  }

  return {
    signingKey,
    privateKey,
    tokenId: process.env.MUX_TOKEN_ID?.trim() || undefined,
    tokenSecret: process.env.MUX_TOKEN_SECRET?.trim() || undefined,
  };
}

export function getMuxPlaybackUrl(playbackId: string): string {
  const normalizedPlaybackId = normalizePlaybackId(playbackId);
  return `https://stream.mux.com/${normalizedPlaybackId}.m3u8`;
}

export async function generateMuxPlaybackToken(
  playbackId: string,
  options: GenerateMuxPlaybackTokenOptions = {},
): Promise<string> {
  const normalizedPlaybackId = normalizePlaybackId(playbackId);
  const expiration = options.expiration?.trim() || getMuxPlaybackTokenTtl();

  try {
    const { signingKey, privateKey, tokenId, tokenSecret } = getMuxConfig();

    const mux = new Mux({
      tokenId: tokenId || undefined,
      tokenSecret: tokenSecret || undefined,
      jwtSigningKey: signingKey,
      jwtPrivateKey: privateKey,
    });

    return (await mux.jwt.signPlaybackId(normalizedPlaybackId, {
      type: "video",
      expiration,
    })) as string;
  } catch (error) {
    if (error instanceof Error) {
      if (/playback id|playbackId|required/i.test(error.message)) {
        throw error;
      }

      if (/missing.*mux|signing configuration|jwt.*key|private key/i.test(error.message)) {
        throw error;
      }
    }

    throw new Error("Failed to generate a signed Mux playback token.");
  }
}
