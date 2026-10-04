import React, { useEffect, useRef, useState } from "react";
import { RectangleHorizontal, RectangleVertical, Volume2, VolumeX } from "lucide-react";
import introVideo from "@/app/Images/intro.mp4";

export function HeroBanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoMode, setVideoMode] = useState<"horizontal" | "vertical">(() => {
    try {
      const saved = localStorage.getItem("know-pollen-video-mode");
      if (saved === "vertical" || saved === "horizontal") return saved;
    } catch {
      // Ignore when storage is blocked
    }
    return "horizontal";
  });

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultPlaybackRate = 0.75;
      videoRef.current.playbackRate = 0.75;
      videoRef.current.muted = true;
    }
  }, []);

  const setVideoPlayback = () => {
    if (videoRef.current) {
      videoRef.current.defaultPlaybackRate = 0.75;
      videoRef.current.playbackRate = 0.75;
      videoRef.current.muted = true;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleModeChange = (mode: "horizontal" | "vertical") => {
    setVideoMode(mode);
    try {
      localStorage.setItem("know-pollen-video-mode", mode);
    } catch {
      // Ignore
    }
  };

  return (
    <section className="relative h-screen h-[100dvh] w-full overflow-hidden bg-black flex items-center justify-center">
      {/* Ambient background blur for vertical mode on wide screens */}
      {videoMode === "vertical" && (
        <video
          src={introVideo}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35 blur-3xl scale-110 hidden md:block"
        />
      )}

      {/* Main hero video */}
      <video
        ref={videoRef}
        src={introVideo}
        autoPlay
        muted
        loop
        playsInline
        onLoadedMetadata={setVideoPlayback}
        aria-label="Pollen fragrance introduction"
        className={
          videoMode === "horizontal"
            ? "absolute inset-0 h-full w-full object-cover object-center transition-all duration-300"
            : "relative z-10 h-full w-auto max-w-full aspect-[9/16] object-contain mx-auto shadow-2xl transition-all duration-300"
        }
      />

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      {/* Dock Controls */}
      <div className="absolute inset-x-3 sm:inset-x-8 bottom-4 sm:bottom-8 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          className="pointer-events-auto flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center border border-white/60 bg-black/40 text-white backdrop-blur-md transition-all duration-200 hover:bg-white hover:text-black active:scale-95"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        <a
          href="/collection"
          className="pointer-events-auto border border-white bg-black/40 px-4 sm:px-8 py-2 sm:py-3 text-[11px] sm:text-sm font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em] text-white backdrop-blur-md transition-all duration-200 hover:bg-white hover:text-black active:scale-95 whitespace-nowrap"
        >
          Discover
        </a>

        <div className="pointer-events-auto flex items-center border border-white/60 bg-black/40 p-0.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleModeChange("horizontal")}
            aria-label="Horizontal video mode"
            title="Horizontal mode"
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-200 ${
              videoMode === "horizontal"
                ? "bg-white text-black"
                : "text-white/70 hover:text-white"
            }`}
          >
            <RectangleHorizontal size={15} />
            <span className="hidden sm:inline">Horizontal</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("vertical")}
            aria-label="Vertical video mode"
            title="Vertical mode"
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-200 ${
              videoMode === "vertical"
                ? "bg-white text-black"
                : "text-white/70 hover:text-white"
            }`}
          >
            <RectangleVertical size={15} />
            <span className="hidden sm:inline">Vertical</span>
          </button>
        </div>
      </div>
    </section>
  );
}
