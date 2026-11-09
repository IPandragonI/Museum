"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ArtImage } from "@/components/ui/ArtImage";
import { useI18n } from "@/lib/i18n/useI18n";
import type { Artwork } from "@/lib/types";
import { InfoPanel } from "./InfoPanel";

interface Props {
  artwork: Artwork | null;
  onClose: () => void;
}

/** Native <dialog>: built-in focus management and Escape to close; focus returns to the opener on close. */
export function ArtworkDialog({ artwork, onClose }: Props) {
  const { t, artist } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (artwork && !d.open) {
      opener.current = document.activeElement;
      d.showModal();
    }
    if (!artwork && d.open) d.close();
  }, [artwork]);

  return (
    <dialog
      ref={ref}
      onClose={() => {
        onClose();
        (opener.current as HTMLElement | null)?.focus?.();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={artwork ? t("info.dialogLabel", { title: artwork.title }) : t("info.dialogFallback")}
      className="m-auto max-h-[94dvh] w-[min(1100px,94vw)] overflow-y-auto rounded-[4px] border border-line bg-bg p-0 backdrop:bg-black/70"
    >
      {artwork ? (
        <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
          <button type="button" onClick={onClose} className="absolute right-2 top-2 z-10 grid size-11 place-items-center rounded-full bg-bg/90 text-ink" aria-label={t("info.close")}>
            <X size={20} aria-hidden />
          </button>
          <div className="flex items-start justify-center bg-surface p-3 sm:p-6">
            <ArtImage artwork={artwork} alt={`${artwork.title}, ${artist(artwork)}`} sizes="(min-width:1024px) 55vw, 90vw" className="max-h-[70dvh] w-auto max-w-full object-contain" priority />
          </div>
          <InfoPanel artwork={artwork} showBio full />
        </div>
      ) : null}
    </dialog>
  );
}
