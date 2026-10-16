import type { SVGProps } from "react";

export type AdminIconName = "overview" | "products" | "categories" | "inventory" | "orders" | "analytics" | "settings" | "photo" | "plus" | "arrow" | "external" | "logout" | "check";
const paths: Record<AdminIconName, string> = {
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  products: "m12 3 9 5v9l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v9 M7.5 5.5l9 5",
  categories: "M3 7h7l2 2h9v11H3z M3 7V4h7l2 3",
  orders: "M6 3h12v19l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6 M9 16h3",
  analytics: "M4 3v18h17 M8 16v-4 M13 16V7 M18 16V4",
  inventory: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 17h7 M17.5 14v7",
  settings: "M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6",
  photo: "M3 4h18v16H3z m0 12 6-6 5 5 3-3 4 4 M16 8h.01",
  plus: "M12 5v14 M5 12h14",
  arrow: "M5 12h14 m-6-6 6 6-6 6",
  external: "M14 3h7v7 M21 3l-11 11 M10 3H3v18h18v-7",
  logout: "M9 3H3v18h6 M9 12h12 m-5-5 5 5-5 5",
  check: "m5 12 4 4L19 6",
};

export function AdminIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: AdminIconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}
