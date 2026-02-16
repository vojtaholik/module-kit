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
  textSectionBlock,
  textSectionPropsSchema,
  type TextSectionProps,
} from "./text-section.block.ts";

// Register all blocks
import { blockRegistry } from "@vojtaholik/static-kit-core";
import { heroBlock } from "./hero.block.ts";
import { featureGridBlock } from "./feature-grid.block.ts";
import { latestPostsBlock } from "./latest-posts.block.ts";
import { textSectionBlock } from "./text-section.block.ts";

export function registerAllBlocks() {
  blockRegistry.register(heroBlock);
  blockRegistry.register(featureGridBlock);
  blockRegistry.register(latestPostsBlock);
  blockRegistry.register(textSectionBlock);
}
