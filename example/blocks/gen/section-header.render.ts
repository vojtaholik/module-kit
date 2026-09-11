// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, assetUrl, type TypedRenderInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress, registerBlockAssets, blockAssetMarker } from "@vojtaholik/static-kit-core";
import type { SectionHeaderProps } from "../section-header.block.ts";

export function renderSectionHeader(input: TypedRenderInput<SectionHeaderProps>): string {
  const { props, ctx, addr } = input;
  const asset = (path: string) => assetUrl(ctx, path);
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--";
  out += escapeAttr(ctx.layout.contentAlign);
  out += " section--tone-";
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
    {
      const _srcVal: unknown = props.image.src;
      if (_srcVal != null && _srcVal !== false) {
        out += " src=\"" + escapeAttr(_srcVal) + "\"";
      }
    }
    {
      const _altVal: unknown = props.image.alt;
      if (_altVal != null && _altVal !== false) {
        out += " alt=\"" + escapeAttr(_altVal) + "\"";
      }
    }
    out += ">";
    out += "</div>";
  }
  if (props.cta) {
    out += "<a";
    out += " class=\"btn btn--outline-dark btn--sm\"";
    {
      const _hrefVal: unknown = props.cta.href;
      if (_hrefVal != null && _hrefVal !== false) {
        out += " href=\"" + escapeAttr(_hrefVal) + "\"";
      }
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
