// Block exports

export {
  type BentoItem,
  type BentoShowcaseProps,
  bentoShowcaseBlock,
  bentoShowcasePropsSchema,
} from "./bento-showcase.block.ts";
export {
  type BusinessCardProps,
  businessCardBlock,
  businessCardPropsSchema,
} from "./business-card.block.ts";
export {
  type CarouselItem,
  type CarouselProps,
  carouselBlock,
  carouselPropsSchema,
} from "./carousel.block.ts";
export {
  type FeatureGridProps,
  featureGridBlock,
  featureGridPropsSchema,
} from "./feature-grid.block.ts";
export { type GridProps, gridBlock, gridPropsSchema } from "./grid.block.ts";
export { type HeroProps, heroBlock, heroPropsSchema } from "./hero.block.ts";
export {
  type LatestPostsProps,
  latestPostsBlock,
  latestPostsPropsSchema,
} from "./latest-posts.block.ts";
export {
  type SectionHeaderProps,
  sectionHeaderBlock,
  sectionHeaderPropsSchema,
} from "./section-header.block.ts";
export {
  type TeaserProps,
  teaserBlock,
  teaserPropsSchema,
} from "./teaser.block.ts";

import type { BentoShowcaseProps } from "./bento-showcase.block.ts";
import type { BusinessCardProps } from "./business-card.block.ts";
import type { CarouselProps } from "./carousel.block.ts";
import type { FeatureGridProps } from "./feature-grid.block.ts";
import type { GridProps } from "./grid.block.ts";
// Type-safe block props — augment BlockPropsMap so page configs get autocomplete
import type { HeroProps } from "./hero.block.ts";
import type { LatestPostsProps } from "./latest-posts.block.ts";
import type { SectionHeaderProps } from "./section-header.block.ts";
import type { TeaserProps } from "./teaser.block.ts";

declare module "@vojtaholik/static-kit-core" {
  interface BlockPropsMap {
    hero: HeroProps;
    featureGrid: FeatureGridProps;
    latestPosts: LatestPostsProps;
    sectionHeader: SectionHeaderProps;
    grid: GridProps;
    teaser: TeaserProps;
    businessCard: BusinessCardProps;
    carousel: CarouselProps;
    bentoShowcase: BentoShowcaseProps;
  }
}

// Register all blocks
import { blockRegistry } from "@vojtaholik/static-kit-core";
import { bentoShowcaseBlock } from "./bento-showcase.block.ts";
import { businessCardBlock } from "./business-card.block.ts";
import { carouselBlock } from "./carousel.block.ts";
import { featureGridBlock } from "./feature-grid.block.ts";
import { gridBlock } from "./grid.block.ts";
import { heroBlock } from "./hero.block.ts";
import { latestPostsBlock } from "./latest-posts.block.ts";
import { sectionHeaderBlock } from "./section-header.block.ts";
import { teaserBlock } from "./teaser.block.ts";

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
