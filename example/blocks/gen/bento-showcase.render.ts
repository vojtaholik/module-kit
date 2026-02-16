// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, type RenderBlockInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress } from "@vojtaholik/static-kit-core";

export function renderBentoShowcase(input: RenderBlockInput): string {
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
  out += " class=\"bento-grid\"";
  out += ">";
  out += "<a";
  out += " class=\"bento-card bento-card--featured\"";
  const _hrefVal = props.featured.href;
  if (_hrefVal) {
    out += " href=\"" + escapeAttr(_hrefVal) + "\"";
  }
  out += ">";
  out += "<img";
  out += " class=\"bento-card__image\"";
  out += " loading=\"lazy\"";
  const _srcVal = props.featured.image.src;
  if (_srcVal) {
    out += " src=\"" + escapeAttr(_srcVal) + "\"";
  }
  const _altVal = props.featured.image.alt;
  if (_altVal) {
    out += " alt=\"" + escapeAttr(_altVal) + "\"";
  }
  out += ">";
  out += "<div";
  out += " class=\"bento-card__caption\"";
  out += ">";
  out += "<div";
  out += " class=\"bento-card__text\"";
  out += ">";
  out += "<h3";
  out += " class=\"bento-card__title\"";
  out += ">";
  out += escapeHtml(props.featured.title);
  out += "</h3>";
  if (props.featured.description) {
    out += "<p";
    out += " class=\"bento-card__description\"";
    out += ">";
    out += escapeHtml(props.featured.description);
    out += "</p>";
  }
  out += "</div>";
  out += "<span";
  out += " class=\"bento-card__arrow\"";
  out += " aria-hidden=\"true\"";
  out += ">";
  out += "<svg";
  out += " class=\"icon\"";
  out += " width=\"12\"";
  out += " height=\"12\"";
  out += ">";
  out += "<use";
  out += " href=\"public/sprite.svg#arrow-right\"";
  out += ">";
  out += "</use>";
  out += "</svg>";
  out += "</span>";
  out += "</div>";
  out += "</a>";
  for (const [_i, item] of (props.items).entries()) {
    out += "<a";
    out += " class=\"bento-card\"";
    const _hrefVal = item.href;
    if (_hrefVal) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
    out += ">";
    out += "<img";
    out += " class=\"bento-card__image\"";
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
    out += "<div";
    out += " class=\"bento-card__caption\"";
    out += ">";
    out += "<div";
    out += " class=\"bento-card__text\"";
    out += ">";
    out += "<h3";
    out += " class=\"bento-card__title\"";
    out += ">";
    out += escapeHtml(item.title);
    out += "</h3>";
    if (item.description) {
      out += "<p";
      out += " class=\"bento-card__description\"";
      out += ">";
      out += escapeHtml(item.description);
      out += "</p>";
    }
    out += "</div>";
    out += "<span";
    out += " class=\"bento-card__arrow\"";
    out += " aria-hidden=\"true\"";
    out += ">";
    out += "<svg";
    out += " class=\"icon\"";
    out += " width=\"12\"";
    out += " height=\"12\"";
    out += ">";
    out += "<use";
    out += " href=\"public/sprite.svg#arrow-right\"";
    out += ">";
    out += "</use>";
    out += "</svg>";
    out += "</span>";
    out += "</div>";
    out += "</a>";
  }
  out += "</div>";
  out += "</div>";
  out += "</section>";

  return out;
}
