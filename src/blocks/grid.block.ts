import { z } from "zod/v4";
import { defineBlock } from "@vojtaholik/static-kit-core";
import { renderGrid } from "./gen/grid.render.ts";

export const gridPropsSchema = z.object({
  itemBlock: z.string(),
  columns: z.enum(["auto", "2", "3", "4", "5"]).optional().default("auto"),
  items: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      image: z
        .object({
          src: z.string(),
          alt: z.string(),
          width: z.number().optional(),
          height: z.number().optional(),
        })
        .optional(),
      link: z.object({
        href: z.string(),
        label: z.string(),
        external: z.boolean().optional(),
      }),
    })
  ),
});

export type GridProps = z.infer<typeof gridPropsSchema>;

export const gridBlock = defineBlock({
  type: "grid",
  propsSchema: gridPropsSchema,
  renderHtml: renderGrid,
  sourceFile: import.meta.url,
});
