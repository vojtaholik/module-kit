// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, type RenderBlockInput } from "@static-block-kit/core";
import { encodeSchemaAddress } from "@static-block-kit/core";

export function renderReference(input: RenderBlockInput): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { props, ctx, addr } = input as { props: any; ctx: typeof input.ctx; addr: typeof input.addr };
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--reference section--tone-";
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
  out += " class=\"carousel__controls\"";
  out += ">";
  out += "<button";
  out += " type=\"button\"";
  out += " class=\"carousel__arrow\"";
  out += " aria-label=\"Previous\"";
  out += " data-carousel-prev=\"\"";
  out += ">";
  out += "<svg";
  out += " class=\"icon\"";
  out += " width=\"16\"";
  out += " height=\"16\"";
  out += " aria-hidden=\"true\"";
  out += ">";
  out += "<use";
  out += " href=\"public/sprite.svg#arrow-left\"";
  out += ">";
  out += "</use>";
  out += "</svg>";
  out += "</button>";
  out += "<button";
  out += " type=\"button\"";
  out += " class=\"carousel__arrow\"";
  out += " aria-label=\"Next\"";
  out += " data-carousel-next=\"\"";
  out += ">";
  out += "<svg";
  out += " class=\"icon\"";
  out += " width=\"16\"";
  out += " height=\"16\"";
  out += " aria-hidden=\"true\"";
  out += ">";
  out += "<use";
  out += " href=\"public/sprite.svg#arrow-right\"";
  out += ">";
  out += "</use>";
  out += "</svg>";
  out += "</button>";
  out += "</div>";
  out += "<div";
  out += " class=\"carousel carousel--reference\"";
  out += " data-carousel=\"\"";
  out += ">";
  for (const [_i, item] of (props.items).entries()) {
    out += "<a";
    out += " class=\"reference__card\"";
    const _hrefVal = item.href || '#';
    if (_hrefVal) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
    out += ">";
    out += "<div";
    out += " class=\"reference__card-image\"";
    out += ">";
    out += "<img";
    out += " loading=\"lazy\"";
    const _srcVal = item.image.src;
    if (_srcVal) {
      out += " src=\"" + escapeAttr(_srcVal) + "\"";
    }
    const _altVal = item.image.alt;
    if (_altVal) {
      out += " alt=\"" + escapeAttr(_altVal) + "\"";
    }
    out += ">";
    out += "</div>";
    out += "<div";
    out += " class=\"reference__card-body\"";
    out += ">";
    out += "<h3";
    out += " class=\"reference__card-title\"";
    out += ">";
    out += escapeHtml(item.title);
    out += "</h3>";
    out += "<p";
    out += " class=\"reference__card-category\"";
    out += ">";
    out += escapeHtml(item.category);
    out += "</p>";
    out += "</div>";
    out += "</a>";
  }
  out += "</div>";
  out += "</div>";
  out += "</section>";

  return out;
}
