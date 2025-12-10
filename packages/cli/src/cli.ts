#!/usr/bin/env bun
/**
 * Static Block Kit CLI
 *
 * Commands:
 *   dev    - Start development server
 *   build  - Build static site for production
 *   gen    - Compile block templates
 *   sprite - Compile SVGs into spritesheet
 */

const command = process.argv[2];

switch (command) {
  case "dev":
    await import("./commands/dev.ts");
    break;
  case "build":
    await import("./commands/build.ts");
    break;
  case "gen":
    await import("./commands/gen.ts");
    break;
  case "sprite":
    await import("./commands/sprite.ts");
    break;
  case "--help":
  case "-h":
  case undefined:
    console.log(`
Static Block Kit CLI

Usage:
  static-block-kit <command>

Commands:
  dev     Start development server with hot reload
  build   Build static site for production
  gen     Compile block templates to render functions
  sprite  Compile SVGs from svg/ into spritesheet

Options:
  --help, -h  Show this help message
`);
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error("Run 'static-block-kit --help' for available commands");
    process.exit(1);
}
