/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import { artworkSrcSet } from "@/lib/data";
import type { Artwork } from "@/lib/types";

interface Props {
  artwork: Artwork;
  /** Accurate alt text (see the per-mode alt strings; it must not give the answer away before answering). */
  alt: string;
  /** `sizes` attribute: how wide the image is rendered, so the browser fetches the smallest adequate variant. */
  sizes: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
}

/**
 * Responsive artwork image: WebP variants of 480 / 960 / 1280px on the long edge are listed in `srcSet`;
 * the browser picks the smallest one that is sharp for the rendered size and device pixel ratio.
 * Width/height are the real intrinsic size (no layout shift), loading is lazy unless `priority`.
 */
export function ArtImage({ artwork, alt, sizes, className, style, priority }: Props) {
  const variants = artwork.images.variants;
  const largest = variants[variants.length - 1];
  return (
    <img
      src={largest.url}
      srcSet={artworkSrcSet(artwork)}
      sizes={sizes}
      width={largest.w}
      height={largest.h}
      alt={alt}
      className={className}
      style={style}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
    />
  );
}

interface PlainProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
}

/** Single-file image (the mystery-detail crop). */
export function PlainImage({ src, alt, width, height, className, style, priority }: PlainProps) {
  return <img src={src} alt={alt} width={width} height={height} className={className} style={style} loading={priority ? "eager" : "lazy"} decoding="async" draggable={false} />;
}

/** Preload the next artwork's gameplay variant so the next question appears instantly. */
export function preloadArtwork(artwork: Artwork | undefined, targetWidth = 960): void {
  if (!artwork || typeof window === "undefined") return;
  const v = artwork.images.variants.find((x) => x.w >= targetWidth || x.h >= targetWidth) ?? artwork.images.variants[artwork.images.variants.length - 1];
  const img = new Image();
  img.decoding = "async";
  img.src = v.url;
}
