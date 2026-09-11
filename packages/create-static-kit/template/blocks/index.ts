// Block exports

export {
  type FeatureGridProps,
  featureGridBlock,
  featureGridPropsSchema,
} from "./feature-grid.block.ts";
export { type HeroProps, heroBlock, heroPropsSchema } from "./hero.block.ts";
export {
  type LatestPostsProps,
  latestPostsBlock,
  latestPostsPropsSchema,
} from "./latest-posts.block.ts";
export {
  type TextSectionProps,
  textSectionBlock,
  textSectionPropsSchema,
} from "./text-section.block.ts";

import type { FeatureGridProps } from "./feature-grid.block.ts";
// Type-safe block props — augment BlockPropsMap so page configs get autocomplete
import type { HeroProps } from "./hero.block.ts";
import type { LatestPostsProps } from "./latest-posts.block.ts";
import type { TextSectionProps } from "./text-section.block.ts";

declare module "@vojtaholik/static-kit-core" {
  interface BlockPropsMap {
    hero: HeroProps;
    featureGrid: FeatureGridProps;
    latestPosts: LatestPostsProps;
    textSection: TextSectionProps;
  }
}

// Register all blocks
import { blockRegistry } from "@vojtaholik/static-kit-core";
import { featureGridBlock } from "./feature-grid.block.ts";
import { heroBlock } from "./hero.block.ts";
import { latestPostsBlock } from "./latest-posts.block.ts";
import { textSectionBlock } from "./text-section.block.ts";

export function registerAllBlocks() {
  blockRegistry.register(heroBlock);
  blockRegistry.register(featureGridBlock);
  blockRegistry.register(latestPostsBlock);
  blockRegistry.register(textSectionBlock);
}
