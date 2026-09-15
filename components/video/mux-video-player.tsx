"use client";

import React, { useEffect, useRef, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import type MuxPlayerElement from "@mux/mux-player";

export type SecureMuxVideoPlayerProps = React.ComponentProps<typeof MuxPlayer> & {
  lessonId: string;
  watermarkId?: string;
  locale?: string;
  title?: string;
  loadingMessage?: string;
  unauthorizedMessage?: string;
  loginRequiredMessage?: string;
  unavailableMessage?: string;
  errorMessage?: string;
};

export function SecureMuxVideoPlayer({
  lessonId,
  watermarkId,
  locale = "ar",
  title,
  loadingMessage = "Loading video...",
  unauthorizedMessage = "You do not have access to this lesson.",
  loginRequiredMessage = "Please log in to access this lesson.",
  unavailableMessage = "This lesson is not available for playback.",
  errorMessage = "The video could not be loaded.",
  onPlay,
  onPlaying,
  onPause,
  onEnded,
  ...props
}: SecureMuxVideoPlayerProps) {
  const playerRef = useRef<MuxPlayerElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [watermarkPosition, setWatermarkPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "unauthorized" | "login" | "unavailable" | "error">("loading");
  const containerId = `mux-player-container-${lessonId}`;

  useEffect(() => {
    let isMounted = true;

    async function requestToken() {
      if (!lessonId) {
        setStatus("unavailable");
        return;
      }

      setIsPlaying(false);
      setStatus("loading");

      try {
        const response = await fetch(`/${locale}/api/video/${lessonId}/token`, {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (!isMounted) {
          return;
        }

        if (response.status === 401) {
          setStatus("login");
          return;
        }

        if (response.status === 403) {
          setStatus("unauthorized");
          return;
        }

        if (response.status === 404 || response.status === 409) {
          setStatus("unavailable");
          return;
        }

        if (!response.ok) {
          setStatus("error");
          return;
        }

        const data = (await response.json()) as { token?: string; playbackId?: string };

        if (!data?.token || !data?.playbackId) {
          setStatus("unavailable");
          return;
        }

        setPlaybackId(data.playbackId);
        setToken(data.token);
        setStatus("ready");
      } catch {
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    void requestToken();

    return () => {
      isMounted = false;
    };
  }, [lessonId, locale]);

  useEffect(() => {
    if (!watermarkId || !isPlaying) {
      return;
    }

    const timer = window.setInterval(() => {
      setWatermarkPosition((position) => (position + 1) % 4);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [isPlaying, watermarkId]);

  useEffect(() => {
    const player = playerRef.current;

    if (status === "ready" && player) {
      // Mux Player 3.13 resolves this ID to the element passed to the
      // browser Fullscreen API. Keeping the watermark inside that container
      // ensures it is part of the true fullscreen tree.
      player.setAttribute("fullscreen-element", containerId);
    }
  }, [containerId, status]);

  if (status === "loading") {
    return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">{loadingMessage}</div>;
  }

  if (status === "login") {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">{loginRequiredMessage}</div>;
  }

  if (status === "unauthorized") {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{unauthorizedMessage}</div>;
  }

  if (status === "unavailable") {
    return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">{unavailableMessage}</div>;
  }

  if (status === "error") {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{errorMessage}</div>;
  }

  if (!playbackId || !token) {
    return null;
  }

  const watermarkPositions = [
    "left-4 top-4",
    "right-4 top-4",
    "left-4 top-1/2 -translate-y-1/2",
    "right-4 top-1/2 -translate-y-1/2",
  ];

  return (
    <div id={containerId} className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <MuxPlayer
        ref={playerRef}
        {...props}
        playbackId={playbackId}
        title={title}
        tokens={{ playback: token }}
        className="h-full w-full"
        fullscreenElement={containerId}
        onPlay={(event) => {
          setIsPlaying(true);
          onPlay?.(event);
        }}
        onPlaying={(event) => {
          setIsPlaying(true);
          onPlaying?.(event);
        }}
        onPause={(event) => {
          setIsPlaying(false);
          onPause?.(event);
        }}
        onEnded={(event) => {
          setIsPlaying(false);
          onEnded?.(event);
        }}
      />
      {watermarkId ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute z-10 rounded-md bg-black/45 px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-white/75 transition-all duration-700 sm:text-xs ${watermarkPositions[watermarkPosition]}`}
        >
          ID-{watermarkId}
        </span>
      ) : null}
    </div>
  );
}
