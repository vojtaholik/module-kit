// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, assetUrl, type TypedRenderInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress, registerBlockAssets, blockAssetMarker } from "@vojtaholik/static-kit-core";
import type { GridProps } from "../grid.block.ts";

export function renderGrid(input: TypedRenderInput<GridProps>): string {
  const { props, ctx, addr } = input;
  const asset = (path: string) => assetUrl(ctx, path);
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--tone-";
  out += escapeAttr(ctx.layout.tone);
  out += "\"";
  if (ctx.isDev) {
    out += " data-block-id=\"";
    out += escapeAttr(addr.blockId);
    out += "\"";
    }
  if (ctx.isDev) {
    out += " data-schema-address=\"";
    out += escapeAttr(encodeSchemaAddress(addr));
    out += "\"";
    }
  out += ">";
  out += "<div";
  out += " class=\"container container--wide\"";
  out += ">";
  out += "<div";
  {
    const _classVal: unknown = `grid${props.columns !== 'auto' ? ` grid--${props.columns}` : ''}`;
    if (_classVal != null && _classVal !== false) {
      out += " class=\"" + escapeAttr(_classVal) + "\"";
    }
  }
  out += ">";
  for (const [i, item] of ((props.items) ?? []).entries()) {
    out += renderSlot(
      props.itemBlock,
      item,
      ctx,
      { ...addr, propPath: `props.items[${i}]` },
      () => {
        let _slot = "";
        return _slot;
      }
    );
  }
  out += "</div>";
  out += "</div>";
  out += "</section>";

  return out;
}
