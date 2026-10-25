const VCDN_BASE_URL =
  process.env.VCDN_BASE_URL ?? "https://cdn.vcdn.me";

const VCDN_EMBED_BASE_URL =
  "https://embed.vcdn.me";

function getVcdnApiKey(): string {
  const apiKey = process.env.VCDN_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("VCDN_API_KEY is not configured.");
  }

  return apiKey.replace(/^["']|["']$/g, "");
}

export interface VcdnPlaybackConfig {
  videoId: string;
  mode: "hls" | "progressive";
  preview: boolean;
  streamUrl: string;
  playbackUrl?: string;
  expires?: number;
  sessionId?: string;
}

export async function getVcdnPlaybackConfig(
  videoId: string,
): Promise<VcdnPlaybackConfig> {
  const apiKey = getVcdnApiKey();

  const response = await fetch(
    `${VCDN_EMBED_BASE_URL}/api/bff/player-config/${encodeURIComponent(videoId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `VCDN player config failed: HTTP ${response.status}`,
    );
  }

  const data = (await response.json()) as VcdnPlaybackConfig;

  if (!data.videoId || !data.streamUrl) {
    throw new Error("Invalid VCDN playback config.");
  }

  return data;
}