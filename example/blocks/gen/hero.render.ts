// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, type RenderBlockInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress } from "@vojtaholik/static-kit-core";

export function renderHero(input: RenderBlockInput): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { props, ctx, addr } = input as { props: any; ctx: typeof input.ctx; addr: typeof input.addr };
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--hero section--tone-";
  out += escapeAttr(ctx.layout.tone);
  out += "\"";
  out += " data-block-id=\"";
  out += escapeAttr(addr.blockId);
  out += "\"";
  out += " data-schema-address=\"";
  out += escapeAttr(encodeSchemaAddress(addr));
  out += "\"";
  const _styleVal = props.backgroundImage ? 'background-image: url(' + props.backgroundImage.src + ')' : '';
  if (_styleVal) {
    out += " style=\"" + escapeAttr(_styleVal) + "\"";
  }
  out += ">";
  out += "<div";
  out += " class=\"container container--wide\"";
  out += ">";
  out += "<div";
  out += " class=\"hero__content\"";
  out += ">";
  out += "<h1";
  out += " class=\"hero__headline\"";
  out += ">";
  out += escapeHtml(props.title);
  out += "</h1>";
  out += "<div";
  out += " class=\"hero__actions\"";
  out += ">";
  for (const [_i, link] of (props.links).entries()) {
    out += "<a";
    out += " class=\"btn btn--sm btn--outline\"";
    const _hrefVal = link.href;
    if (_hrefVal) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
    out += ">";
    out += escapeHtml(link.label);
    out += "</a>";
  }
  out += "</div>";
  out += "</div>";
  out += "</div>";
  out += "</section>";

  return out;
}
