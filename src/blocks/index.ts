// Block exports
export { heroBlock, heroPropsSchema, type HeroProps } from "./hero.block.ts";
export {
  featureGridBlock,
  featureGridPropsSchema,
  type FeatureGridProps,
} from "./feature-grid.block.ts";
export {
  latestPostsBlock,
  latestPostsPropsSchema,
  type LatestPostsProps,
} from "./latest-posts.block.ts";
export {
  sectionHeaderBlock,
  sectionHeaderPropsSchema,
  type SectionHeaderProps,
} from "./section-header.block.ts";

// Register all blocks
import { blockRegistry } from "@static-block-kit/core";
import { heroBlock } from "./hero.block.ts";
import { featureGridBlock } from "./feature-grid.block.ts";
import { latestPostsBlock } from "./latest-posts.block.ts";
import { sectionHeaderBlock } from "./section-header.block.ts";

export function registerAllBlocks() {
  blockRegistry.register(heroBlock);
  blockRegistry.register(featureGridBlock);
  blockRegistry.register(latestPostsBlock);
  blockRegistry.register(sectionHeaderBlock);
}
