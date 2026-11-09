"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ArtImage } from "@/components/ui/ArtImage";
import { InfoPanel } from "./InfoPanel";
import type { Artwork } from "@/lib/types";

interface Props {
  artwork: Artwork | null;
  onClose: () => void;
}

/** Native <dialog>: built-in focus management, Escape to close, inert background. */
export function ArtworkDialog({ artwork, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (artwork && !d.open) d.showModal();
    if (!artwork && d.open) d.close();
  }, [artwork]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={artwork ? `${artwork.title}, details` : "Artwork details"}
      className="m-auto max-h-[94dvh] w-[min(1100px,94vw)] overflow-y-auto rounded-[4px] border border-line bg-bg p-0 backdrop:bg-black/70"
    >
      {artwork ? (
        <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
          <button type="button" onClick={onClose} className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-bg/90 text-ink" aria-label="Close">
            <X size={20} aria-hidden />
          </button>
          <div className="flex items-start justify-center bg-surface p-3 sm:p-6">
            <ArtImage src={artwork.imageUrl} alt={`${artwork.title}${artwork.artist ? ` by ${artwork.artist}` : ""}`} width={artwork.imageWidth} height={artwork.imageHeight} className="max-h-[70dvh] w-auto max-w-full object-contain" />
          </div>
          <InfoPanel artwork={artwork} showBio full />
        </div>
      ) : null}
    </dialog>
  );
}
