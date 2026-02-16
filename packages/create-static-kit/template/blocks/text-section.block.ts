import { z } from "zod/v4";
import { defineBlock } from "@vojtaholik/static-kit-core";
import { renderTextSection } from "./gen/text-section.render.ts";

export const textSectionPropsSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().optional(),
  body: z.string(), // Rich text / HTML content
  cta: z
    .object({
      href: z.string(),
      label: z.string(),
      external: z.boolean().optional(),
    })
    .optional(),
});

export type TextSectionProps = z.infer<typeof textSectionPropsSchema>;

export const textSectionBlock = defineBlock({
  type: "textSection",
  propsSchema: textSectionPropsSchema,
  renderHtml: renderTextSection,
  sourceFile: import.meta.url,
});
