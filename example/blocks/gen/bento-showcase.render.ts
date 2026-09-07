// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, assetUrl, type TypedRenderInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress, registerBlockAssets, blockAssetMarker } from "@vojtaholik/static-kit-core";
import type { BentoShowcaseProps } from "../bento-showcase.block.ts";

export function renderBentoShowcase(input: TypedRenderInput<BentoShowcaseProps>): string {
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
  out += " class=\"bento-grid\"";
  out += ">";
  out += "<a";
  out += " class=\"bento-card bento-card--featured\"";
  {
    const _hrefVal: unknown = props.featured.href;
    if (_hrefVal != null && _hrefVal !== false) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
  }
  out += ">";
  out += "<img";
  out += " class=\"bento-card__image\"";
  out += " loading=\"lazy\"";
  {
    const _srcVal: unknown = props.featured.image.src;
    if (_srcVal != null && _srcVal !== false) {
      out += " src=\"" + escapeAttr(_srcVal) + "\"";
    }
  }
  {
    const _altVal: unknown = props.featured.image.alt;
    if (_altVal != null && _altVal !== false) {
      out += " alt=\"" + escapeAttr(_altVal) + "\"";
    }
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
  {
    const _hrefVal: unknown = asset('sprite.svg') + '#arrow-right';
    if (_hrefVal != null && _hrefVal !== false) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
  }
  out += ">";
  out += "</use>";
  out += "</svg>";
  out += "</span>";
  out += "</div>";
  out += "</a>";
  for (const [_i, item] of ((props.items) ?? []).entries()) {
    out += "<a";
    out += " class=\"bento-card\"";
    {
      const _hrefVal: unknown = item.href;
      if (_hrefVal != null && _hrefVal !== false) {
        out += " href=\"" + escapeAttr(_hrefVal) + "\"";
      }
    }
    out += ">";
    out += "<img";
    out += " class=\"bento-card__image\"";
    out += " loading=\"lazy\"";
    {
      const _srcVal: unknown = item.image.src;
      if (_srcVal != null && _srcVal !== false) {
        out += " src=\"" + escapeAttr(_srcVal) + "\"";
      }
    }
    {
      const _altVal: unknown = item.image.alt;
      if (_altVal != null && _altVal !== false) {
        out += " alt=\"" + escapeAttr(_altVal) + "\"";
      }
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
    {
      const _hrefVal: unknown = asset('sprite.svg') + '#arrow-right';
      if (_hrefVal != null && _hrefVal !== false) {
        out += " href=\"" + escapeAttr(_hrefVal) + "\"";
      }
    }
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
