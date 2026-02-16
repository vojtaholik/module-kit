// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, type RenderBlockInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress } from "@vojtaholik/static-kit-core";

export function renderSectionHeader(input: RenderBlockInput): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { props, ctx, addr } = input as { props: any; ctx: typeof input.ctx; addr: typeof input.addr };
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--";
  out += escapeAttr(ctx.layout.contentAlign);
  out += " section--tone-";
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
  out += " class=\"";
  out += "section-header section-header--";
  out += escapeAttr(ctx.layout.contentAlign);
  out += "\"";
  out += ">";
  out += "<div";
  out += " class=\"section-header__content\"";
  out += ">";
  if (props.headline) {
    out += "<h2";
    out += ">";
    out += escapeHtml(props.headline);
    out += "</h2>";
  }
  if (props.body) {
    out += "<div";
    out += " class=\"prose\"";
    out += ">";
    out += props.body;
    out += "</div>";
  }
  out += "</div>";
  if (props.image) {
    out += "<div";
    out += " class=\"section-header__image\"";
    out += ">";
    out += "<img";
    out += " width=\"100%\"";
    out += " height=\"auto\"";
    out += " loading=\"lazy\"";
    const _srcVal = props.image.src;
    if (_srcVal) {
      out += " src=\"" + escapeAttr(_srcVal) + "\"";
    }
    const _altVal = props.image.alt;
    if (_altVal) {
      out += " alt=\"" + escapeAttr(_altVal) + "\"";
    }
    out += ">";
    out += "</div>";
  }
  if (props.cta) {
    out += "<a";
    out += " class=\"btn btn--outline-dark btn--sm\"";
    const _hrefVal = props.cta.href;
    if (_hrefVal) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
    out += ">";
    out += escapeHtml(props.cta.label);
    out += "</a>";
  }
  out += "</div>";
  out += "</div>";
  out += "</section>";

  return out;
}
