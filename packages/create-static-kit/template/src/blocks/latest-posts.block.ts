import { z } from "zod/v4";
import { defineBlock } from "@static-block-kit/core";
import { renderLatestPosts } from "./gen/latest-posts.render.ts";

export const latestPostsPropsSchema = z.object({
  headline: z.string().default("Latest Posts"),
  subheadline: z.string().optional(),
  count: z.number().default(3),
  posts: z.array(
    z.object({
      title: z.string(),
      excerpt: z.string().optional(),
      date: z.string().optional(),
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
  viewAllLink: z
    .object({
      href: z.string(),
      label: z.string(),
      external: z.boolean().optional(),
    })
    .optional(),
});

export type LatestPostsProps = z.infer<typeof latestPostsPropsSchema>;

export const latestPostsBlock = defineBlock({
  type: "latestPosts",
  propsSchema: latestPostsPropsSchema,
  renderHtml: renderLatestPosts,
  sourceFile: import.meta.url,
});
