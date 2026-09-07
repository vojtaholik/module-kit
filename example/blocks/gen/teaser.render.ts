// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, assetUrl, type TypedRenderInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress, registerBlockAssets, blockAssetMarker } from "@vojtaholik/static-kit-core";
import type { TeaserProps } from "../teaser.block.ts";

export function renderTeaser(input: TypedRenderInput<TeaserProps>): string {
  const { props, ctx, addr } = input;
  const asset = (path: string) => assetUrl(ctx, path);
  let out = "";
  out += "<a";
  out += " class=\"card\"";
  {
    const _hrefVal: unknown = props.link.href;
    if (_hrefVal != null && _hrefVal !== false) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
  }
  out += ">";
  if (props.image) {
    out += "<div";
    out += " class=\"card__image\"";
    out += ">";
    out += "<img";
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
  out += "<div";
  out += " class=\"card__body\"";
  out += ">";
  out += "<h3";
  out += " class=\"card__title\"";
  out += ">";
  out += escapeHtml(props.title);
  out += "</h3>";
  if (props.subtitle) {
    out += "<p";
    out += " class=\"card__subtitle\"";
    out += ">";
    out += escapeHtml(props.subtitle);
    out += "</p>";
  }
  out += "</div>";
  out += "</a>";

  return out;
}
