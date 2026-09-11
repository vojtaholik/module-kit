import { z } from "zod/v4";

// Schema address for CMS editing - points to a specific editable location
export const schemaAddressSchema = z.object({
  pageId: z.string(),
  region: z.string(),
  blockId: z.string(),
  propPath: z.string().optional(),
});

export type SchemaAddress = z.infer<typeof schemaAddressSchema>;

const SEPARATOR = "::";

/**
 * Encode a schema address into a string for data attributes
 * Format: pageId::region::blockId[::propPath]
 */
export function encodeSchemaAddress(addr: SchemaAddress): string {
  const parts = [addr.pageId, addr.region, addr.blockId];
  if (addr.propPath) {
    parts.push(addr.propPath);
  }
  return parts.join(SEPARATOR);
}

/**
 * Decode a schema address string back into structured form
 */
export function decodeSchemaAddress(encoded: string): SchemaAddress {
  const parts = encoded.split(SEPARATOR);
  if (parts.length < 3) {
    throw new Error(`Invalid schema address: ${encoded}`);
  }

  const result = schemaAddressSchema.parse({
    pageId: parts[0],
    region: parts[1],
    blockId: parts[2],
    propPath: parts[3],
  });

  return result;
}

/**
 * Create a schema address for a specific prop path within a block
 */
export function withPropPath(addr: SchemaAddress, propPath: string): SchemaAddress {
  return { ...addr, propPath };
}

/**
 * Check if an address points to a specific block (ignoring propPath)
 */
export function isSameBlock(a: SchemaAddress, b: SchemaAddress): boolean {
  return a.pageId === b.pageId && a.region === b.region && a.blockId === b.blockId;
}
