"use client";

import React, { useEffect, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";

export type SecureMuxVideoPlayerProps = React.ComponentProps<typeof MuxPlayer> & {
  lessonId: string;
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
  locale = "ar",
  title,
  loadingMessage = "Loading video...",
  unauthorizedMessage = "You do not have access to this lesson.",
  loginRequiredMessage = "Please log in to access this lesson.",
  unavailableMessage = "This lesson is not available for playback.",
  errorMessage = "The video could not be loaded.",
  ...props
}: SecureMuxVideoPlayerProps) {
  const [token, setToken] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unauthorized" | "login" | "unavailable" | "error">("loading");

  useEffect(() => {
    let isMounted = true;

    async function requestToken() {
      if (!lessonId) {
        setStatus("unavailable");
        return;
      }

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

  return (
    <MuxPlayer
      playbackId={playbackId}
      title={title}
      tokens={{ playback: token }}
      className="aspect-video w-full rounded-2xl"
      {...props}
    />
  );
}
