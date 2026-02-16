import { z } from "zod/v4";
import { defineBlock } from "@vojtaholik/static-kit-core";
import { renderFeatureGrid } from "./gen/feature-grid.render.ts";

export const featureGridPropsSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  columns: z.enum(["2", "3", "4"]).default("3"),
  features: z.array(
    z.object({
      icon: z.string().optional(),
      title: z.string(),
      description: z.string(),
      link: z
        .object({
          href: z.string(),
          label: z.string(),
          external: z.boolean().optional(),
        })
        .optional(),
    })
  ),
});

export type FeatureGridProps = z.infer<typeof featureGridPropsSchema>;

export const featureGridBlock = defineBlock({
  type: "featureGrid",
  propsSchema: featureGridPropsSchema,
  renderHtml: renderFeatureGrid,
  sourceFile: import.meta.url,
});
