import { z } from "zod/v4";

// Layout enums - design system tokens for blocks
export const toneEnum = z.enum(["surface", "raised", "accent", "inverted"]);
export const contentAlignEnum = z.enum([
  "left",
  "center",
  "right",
  "split-start",
  "split-end",
]);
export const densityEnum = z.enum(["compact", "comfortable", "relaxed"]);
export const contentWidthEnum = z.enum(["narrow", "default", "wide"]);

// Combined layout props schema for block rendering context
export const layoutPropsSchema = z.object({
  tone: toneEnum.default("surface"),
  contentAlign: contentAlignEnum.default("left"),
  density: densityEnum.default("comfortable"),
  contentWidth: contentWidthEnum.default("default"),
});

export type Tone = z.infer<typeof toneEnum>;
export type ContentAlign = z.infer<typeof contentAlignEnum>;
export type Density = z.infer<typeof densityEnum>;
export type ContentWidth = z.infer<typeof contentWidthEnum>;
export type LayoutProps = z.infer<typeof layoutPropsSchema>;
