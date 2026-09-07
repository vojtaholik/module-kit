// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, assetUrl, type TypedRenderInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress, registerBlockAssets, blockAssetMarker } from "@vojtaholik/static-kit-core";
import type { TextSectionProps } from "../text-section.block.ts";

export function renderTextSection(input: TypedRenderInput<TextSectionProps>): string {
  const { props, ctx, addr } = input;
  const asset = (path: string) => assetUrl(ctx, path);
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--text section--tone-";
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
  out += "<div";
  out += " class=\"";
  out += "text-section text-section--";
  out += escapeAttr(ctx.layout.contentAlign);
  out += "\"";
  out += ">";
  if (props.eyebrow) {
    out += "<span";
    out += " class=\"eyebrow\"";
    out += ">";
    out += escapeHtml(props.eyebrow);
    out += "</span>";
  }
  if (props.headline) {
    out += "<h2";
    out += " class=\"h2\"";
    out += ">";
    out += escapeHtml(props.headline);
    out += "</h2>";
  }
  out += "<div";
  out += " class=\"prose\"";
  out += ">";
  out += props.body;
  out += "</div>";
  if (props.cta) {
    out += "<div";
    out += " class=\"text-section__cta\"";
    out += ">";
    out += "<a";
    out += " class=\"btn btn--primary\"";
    {
      const _hrefVal: unknown = props.cta.href;
      if (_hrefVal != null && _hrefVal !== false) {
        out += " href=\"" + escapeAttr(_hrefVal) + "\"";
      }
    }
    out += ">";
    out += escapeHtml(props.cta.label);
    out += "</a>";
    out += "</div>";
  }
  out += "</div>";
  out += "</div>";
  out += "</section>";

  return out;
}
