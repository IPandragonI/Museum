import { BarChart3, Calendar, GalleryVertical, Home, Settings } from "lucide-react";

export const NAV = [
  { href: "/", label: "Play", icon: Home },
  { href: "/daily/", label: "Daily", icon: Calendar },
  { href: "/collection/", label: "Collection", icon: GalleryVertical },
  { href: "/stats/", label: "Statistics", icon: BarChart3 },
  { href: "/settings/", label: "Settings", icon: Settings },
] as const;

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/play");
  return pathname.startsWith(href.replace(/\/$/, ""));
}
