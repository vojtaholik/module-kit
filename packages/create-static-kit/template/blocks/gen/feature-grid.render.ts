// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, assetUrl, type TypedRenderInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress, registerBlockAssets, blockAssetMarker } from "@vojtaholik/static-kit-core";
import type { FeatureGridProps } from "../feature-grid.block.ts";

export function renderFeatureGrid(input: TypedRenderInput<FeatureGridProps>): string {
  const { props, ctx, addr } = input;
  const asset = (path: string) => assetUrl(ctx, path);
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--feature-grid section--tone-";
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
  out += " class=\"";
  out += "container container--";
  out += escapeAttr(ctx.layout.contentWidth);
  out += "\"";
  out += ">";
  if (props.headline || props.subheadline) {
    out += "<div";
    out += " class=\"";
    out += "section__header section__header--";
    out += escapeAttr(ctx.layout.contentAlign);
    out += "\"";
    out += ">";
    if (props.headline) {
      out += "<h2";
      out += " class=\"h2\"";
      out += ">";
      out += escapeHtml(props.headline);
      out += "</h2>";
    }
    if (props.subheadline) {
      out += "<p";
      out += " class=\"text-body\"";
      out += ">";
      out += escapeHtml(props.subheadline);
      out += "</p>";
    }
    out += "</div>";
  }
  out += "<div";
  out += " class=\"";
  out += "grid grid--";
  out += escapeAttr(props.columns || '3');
  out += "\"";
  out += ">";
  for (const [i, feature] of ((props.features) ?? []).entries()) {
    out += "<div";
    out += " class=\"card\"";
    out += ">";
    if (feature.icon) {
      out += "<span";
      out += " class=\"card__icon\"";
      out += ">";
      out += escapeHtml(feature.icon);
      out += "</span>";
    }
    out += "<h3";
    out += " class=\"h3 card__title\"";
    out += ">";
    out += escapeHtml(feature.title);
    out += "</h3>";
    out += "<p";
    out += " class=\"text-body card__description\"";
    out += ">";
    out += escapeHtml(feature.description);
    out += "</p>";
    if (feature.link) {
      out += "<a";
      out += " class=\"card__link\"";
      {
        const _hrefVal: unknown = feature.link.href;
        if (_hrefVal != null && _hrefVal !== false) {
          out += " href=\"" + escapeAttr(_hrefVal) + "\"";
        }
      }
      out += ">";
      out += escapeHtml(feature.link.label);
      out += "</a>";
    }
    out += "</div>";
  }
  out += "</div>";
  out += "</div>";
  out += "</section>";

  return out;
}
