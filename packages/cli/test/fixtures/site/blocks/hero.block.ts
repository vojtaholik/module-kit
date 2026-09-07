import { z } from "zod/v4";
import { defineBlock } from "@vojtaholik/static-kit-core";
import { renderHero } from "./gen/hero.render.ts";

export const heroPropsSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
});

export type HeroProps = z.infer<typeof heroPropsSchema>;

export const heroBlock = defineBlock({
  type: "hero",
  propsSchema: heroPropsSchema,
  renderHtml: renderHero,
});
