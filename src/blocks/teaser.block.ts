import { z } from "zod/v4";
import { defineBlock } from "@vojtaholik/static-kit-core";
import { renderTeaser } from "./gen/teaser.render.ts";

export const teaserPropsSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  image: z
    .object({
      src: z.string(),
      alt: z.string(),
    })
    .optional(),
  link: z.object({
    href: z.string(),
    label: z.string(),
    external: z.boolean().optional(),
  }),
});

export type TeaserProps = z.infer<typeof teaserPropsSchema>;

export const teaserBlock = defineBlock({
  type: "teaser",
  propsSchema: teaserPropsSchema,
  renderHtml: renderTeaser,
  sourceFile: import.meta.url,
});
