import type { PageConfig } from "@vojtaholik/static-kit-core";
import { indexPage } from "./index.page.ts";
import { aboutPage } from "./about.page.ts";

// All pages in the site
export const pages: PageConfig[] = [indexPage, aboutPage];

// Get page by path
export function getPageByPath(path: string): PageConfig | undefined {
  return pages.find((p) => p.path === path);
}

// Get page by id
export function getPageById(id: string): PageConfig | undefined {
  return pages.find((p) => p.id === id);
}
