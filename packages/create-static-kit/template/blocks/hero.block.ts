import { z } from "zod/v4";
import { defineBlock } from "@vojtaholik/static-kit-core";
import { renderHero } from "./gen/hero.render.ts";

export const heroPropsSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string(),
  subheadline: z.string().optional(),
  primaryCta: z
    .object({
      href: z.string(),
      label: z.string(),
      external: z.boolean().optional(),
    })
    .optional(),
  secondaryCta: z
    .object({
      href: z.string(),
      label: z.string(),
      external: z.boolean().optional(),
    })
    .optional(),
  backgroundImage: z
    .object({
      src: z.string(),
      alt: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
});

export type HeroProps = z.infer<typeof heroPropsSchema>;

export const heroBlock = defineBlock({
  type: "hero",
  propsSchema: heroPropsSchema,
  renderHtml: renderHero,
  sourceFile: import.meta.url,
});
