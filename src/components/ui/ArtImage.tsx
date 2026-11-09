/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

interface Props {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  width?: number;
  height?: number;
}

/** Plain <img> (the app is a static export with locally bundled artwork files). */
export function ArtImage({ src, alt, className, style, priority, width, height }: Props) {
  return <img src={src} alt={alt} width={width} height={height} className={className} style={style} loading={priority ? "eager" : "lazy"} decoding="async" draggable={false} />;
}
