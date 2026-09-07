import { blockRegistry } from "@vojtaholik/static-kit-core";
import { heroBlock } from "./hero.block.ts";

export function registerAllBlocks() {
  blockRegistry.register(heroBlock);
}
