// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, type RenderBlockInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress } from "@vojtaholik/static-kit-core";

export function renderGrid(input: RenderBlockInput): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { props, ctx, addr } = input as { props: any; ctx: typeof input.ctx; addr: typeof input.addr };
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--tone-";
  out += escapeAttr(ctx.layout.tone);
  out += "\"";
  out += " data-block-id=\"";
  out += escapeAttr(addr.blockId);
  out += "\"";
  out += " data-schema-address=\"";
  out += escapeAttr(encodeSchemaAddress(addr));
  out += "\"";
  out += ">";
  out += "<div";
  out += " class=\"container container--wide\"";
  out += ">";
  out += "<div";
  const _classVal = `grid${props.columns !== 'auto' ? ` grid--${props.columns}` : ''}`;
  if (_classVal) {
    out += " class=\"" + escapeAttr(_classVal) + "\"";
  }
  out += ">";
  for (const [i, item] of (props.items).entries()) {
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
