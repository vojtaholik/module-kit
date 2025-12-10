import { z } from "zod/v4";
import { defineBlock } from "@static-block-kit/core";
import { renderReference } from "./gen/reference.render.ts";

export const referencePropsSchema = z.object({
  items: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      image: z.object({
        src: z.string(),
        alt: z.string(),
      }),
      href: z.string().optional(),
    })
  ),
});

export type ReferenceProps = z.infer<typeof referencePropsSchema>;

export const referenceBlock = defineBlock({
  type: "reference",
  propsSchema: referencePropsSchema,
  renderHtml: renderReference,
  sourceFile: import.meta.url,
});
