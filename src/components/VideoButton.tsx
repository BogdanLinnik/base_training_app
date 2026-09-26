"use client";

import { useState } from "react";
import { getYoutubeEmbedUrl } from "@/lib/youtube";

export function VideoButton({ url, className }: { url: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const embedUrl = getYoutubeEmbedUrl(url);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "text-xs text-blue-600 hover:underline"}
      >
        ▶ Відео
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 z-10 rounded-full bg-black/60 text-white w-8 h-8 text-sm hover:bg-black/80"
              aria-label="Закрити"
            >
              ✕
            </button>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm p-4 text-center">
                Не вдалося розпізнати посилання на YouTube.{" "}
                <a href={url} target="_blank" className="underline ml-1">
                  Відкрити напряму
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
