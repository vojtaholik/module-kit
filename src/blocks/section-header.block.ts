import { z } from "zod/v4";
import { defineBlock } from "@static-block-kit/core";
import { renderSectionHeader } from "./gen/section-header.render.ts";

export const sectionHeaderPropsSchema = z.object({
  headline: z.string().optional(),
  body: z.string(), // Rich text / HTML content
  image: z
    .object({
      src: z.string(),
      alt: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
});

export type SectionHeaderProps = z.infer<typeof sectionHeaderPropsSchema>;

export const sectionHeaderBlock = defineBlock({
  type: "sectionHeader",
  propsSchema: sectionHeaderPropsSchema,
  renderHtml: renderSectionHeader,
  sourceFile: import.meta.url,
});
