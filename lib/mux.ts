import Mux from "@mux/mux-node";

export const DEFAULT_MUX_PLAYBACK_TOKEN_TTL = "1h";
const MIN_MUX_PLAYBACK_TOKEN_TTL_MS = 5 * 60 * 1000;
const MAX_MUX_PLAYBACK_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function parseMuxPlaybackTokenTtl(ttl: string): number | null {
  const match = ttl.trim().match(/^([0-9]+)([smhd])$/i);

  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  const lifetimeMs = value * multipliers[unit];

  return Number.isSafeInteger(lifetimeMs) ? lifetimeMs : null;
}

export function normalizeMuxPlaybackTokenTtl(ttl?: string | null) {
  const candidate = ttl?.trim() || DEFAULT_MUX_PLAYBACK_TOKEN_TTL;
  const lifetimeMs = parseMuxPlaybackTokenTtl(candidate);

  if (
    lifetimeMs === null ||
    lifetimeMs < MIN_MUX_PLAYBACK_TOKEN_TTL_MS ||
    lifetimeMs > MAX_MUX_PLAYBACK_TOKEN_TTL_MS
  ) {
    return DEFAULT_MUX_PLAYBACK_TOKEN_TTL;
  }

  return candidate;
}

export function getMuxPlaybackTokenTtl() {
  return normalizeMuxPlaybackTokenTtl(process.env.MUX_PLAYBACK_TOKEN_TTL);
}

export function getMuxPlaybackTokenLifetimeMs(ttl: string = getMuxPlaybackTokenTtl()) {
  return parseMuxPlaybackTokenTtl(normalizeMuxPlaybackTokenTtl(ttl)) ?? 60 * 60 * 1000;
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
  const expiration = normalizeMuxPlaybackTokenTtl(options.expiration || getMuxPlaybackTokenTtl());

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
