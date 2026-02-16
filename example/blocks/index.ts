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
export { gridBlock, gridPropsSchema, type GridProps } from "./grid.block.ts";
export {
  teaserBlock,
  teaserPropsSchema,
  type TeaserProps,
} from "./teaser.block.ts";
export {
  businessCardBlock,
  businessCardPropsSchema,
  type BusinessCardProps,
} from "./business-card.block.ts";
export {
  carouselBlock,
  carouselPropsSchema,
  type CarouselProps,
  type CarouselItem,
} from "./carousel.block.ts";
export {
  bentoShowcaseBlock,
  bentoShowcasePropsSchema,
  type BentoShowcaseProps,
  type BentoItem,
} from "./bento-showcase.block.ts";

// Register all blocks
import { blockRegistry } from "@vojtaholik/static-kit-core";
import { heroBlock } from "./hero.block.ts";
import { featureGridBlock } from "./feature-grid.block.ts";
import { latestPostsBlock } from "./latest-posts.block.ts";
import { sectionHeaderBlock } from "./section-header.block.ts";
import { gridBlock } from "./grid.block.ts";
import { teaserBlock } from "./teaser.block.ts";
import { businessCardBlock } from "./business-card.block.ts";
import { carouselBlock } from "./carousel.block.ts";
import { bentoShowcaseBlock } from "./bento-showcase.block.ts";

export function registerAllBlocks() {
  blockRegistry.register(heroBlock);
  blockRegistry.register(featureGridBlock);
  blockRegistry.register(latestPostsBlock);
  blockRegistry.register(sectionHeaderBlock);
  blockRegistry.register(gridBlock);
  blockRegistry.register(teaserBlock);
  blockRegistry.register(businessCardBlock);
  blockRegistry.register(carouselBlock);
  blockRegistry.register(bentoShowcaseBlock);
}
