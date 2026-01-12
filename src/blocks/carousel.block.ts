import { z } from "zod/v4";
import { defineBlock } from "@static-block-kit/core";
import { renderCarousel } from "./gen/carousel.render.ts";

const carouselItemSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  image: z.object({
    src: z.string(),
    alt: z.string(),
  }),
  href: z.string().optional(),
});

export const carouselPropsSchema = z.object({
  items: z.array(carouselItemSchema),
  /** Card styling variant */
  variant: z.enum(["default", "reference"]).default("default"),
});

export type CarouselProps = z.infer<typeof carouselPropsSchema>;
export type CarouselItem = z.infer<typeof carouselItemSchema>;

export const carouselBlock = defineBlock({
  type: "carousel",
  propsSchema: carouselPropsSchema,
  renderHtml: renderCarousel,
  sourceFile: import.meta.url,
});
