import { z } from "zod/v4";
import { defineBlock } from "@static-block-kit/core";
import { renderBentoShowcase } from "./gen/bento-showcase.render.ts";

const bentoItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  image: z.object({
    src: z.string(),
    alt: z.string(),
  }),
  href: z.string(),
});

export const bentoShowcasePropsSchema = z.object({
  /** Featured item - displays large, spanning 2 rows on left */
  featured: bentoItemSchema,
  /** Secondary items - display stacked on right (max 2 recommended) */
  items: z.array(bentoItemSchema).min(1).max(4),
});

export type BentoShowcaseProps = z.infer<typeof bentoShowcasePropsSchema>;
export type BentoItem = z.infer<typeof bentoItemSchema>;

export const bentoShowcaseBlock = defineBlock({
  type: "bentoShowcase",
  propsSchema: bentoShowcasePropsSchema,
  renderHtml: renderBentoShowcase,
  sourceFile: import.meta.url,
});
