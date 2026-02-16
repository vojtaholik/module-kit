// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, type RenderBlockInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress } from "@vojtaholik/static-kit-core";

export function renderCarousel(input: RenderBlockInput): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { props, ctx, addr } = input as { props: any; ctx: typeof input.ctx; addr: typeof input.addr };
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--carousel section--tone-";
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
  out += " data-carousel=\"\"";
  const _classVal = 'carousel carousel--' + props.variant;
  if (_classVal) {
    out += " class=\"" + escapeAttr(_classVal) + "\"";
  }
  out += ">";
  for (const [_i, item] of (props.items).entries()) {
    out += "<a";
    const _hrefVal = item.href || '#';
    if (_hrefVal) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
    const _classVal = 'carousel__card carousel__card--' + props.variant;
    if (_classVal) {
      out += " class=\"" + escapeAttr(_classVal) + "\"";
    }
    out += ">";
    out += "<div";
    out += " class=\"carousel__card-image\"";
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
    out += " class=\"carousel__card-body\"";
    out += ">";
    out += "<h3";
    out += " class=\"carousel__card-title\"";
    out += ">";
    out += escapeHtml(item.title);
    out += "</h3>";
    if (item.subtitle) {
      out += "<p";
      out += " class=\"carousel__card-subtitle\"";
      out += ">";
      out += escapeHtml(item.subtitle);
      out += "</p>";
    }
    out += "</div>";
    out += "</a>";
  }
  out += "</div>";
  out += "</div>";
  out += "</section>";

  return out;
}
