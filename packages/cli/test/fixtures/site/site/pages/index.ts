import type { PageConfig } from "@vojtaholik/static-kit-core";

export const pages: PageConfig[] = [
  {
    id: "index",
    path: "/",
    title: "Home",
    template: "base.html",
    meta: { description: "Fixture home", "og:title": "Home OG" },
    regions: {
      main: {
        blocks: [
          { id: "hero-1", type: "hero", props: { title: "Hello" } },
          { id: "hero-2", type: "hero", props: { title: "Again", subtitle: "sub" } },
        ],
      },
    },
  },
  {
    id: "about",
    path: "/about",
    title: "About",
    template: "base.html",
    regions: { main: { blocks: [{ id: "hero-1", type: "hero", props: { title: "About" } }] } },
  },
];

export function getPageByPath(path: string): PageConfig | undefined {
  return pages.find((p) => p.path === path);
}
