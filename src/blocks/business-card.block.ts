import { z } from "zod/v4";
import { defineBlock } from "@vojtaholik/static-kit-core";
import { renderBusinessCard } from "./gen/business-card.render.ts";

export const businessCardPropsSchema = z.object({
  headline: z.string(),
  body: z.string().optional(),
  primaryCta: z.object({
    href: z.string(),
    label: z.string(),
  }),
  contactLinks: z
    .array(
      z.object({
        href: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  contactPerson: z
    .object({
      name: z.string(),
      title: z.string(),
      regions: z.string().optional(),
      image: z
        .object({
          src: z.string(),
          alt: z.string(),
        })
        .optional(),
    })
    .optional(),
});

export type BusinessCardProps = z.infer<typeof businessCardPropsSchema>;

export const businessCardBlock = defineBlock({
  type: "businessCard",
  propsSchema: businessCardPropsSchema,
  renderHtml: renderBusinessCard,
  sourceFile: import.meta.url,
});
