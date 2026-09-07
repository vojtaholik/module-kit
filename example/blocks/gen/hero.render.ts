// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, assetUrl, type TypedRenderInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress, registerBlockAssets, blockAssetMarker } from "@vojtaholik/static-kit-core";
import type { HeroProps } from "../hero.block.ts";

export function renderHero(input: TypedRenderInput<HeroProps>): string {
  const { props, ctx, addr } = input;
  const asset = (path: string) => assetUrl(ctx, path);
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--hero section--tone-";
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
  {
    const _styleVal: unknown = props.backgroundImage ? 'background-image: url(' + props.backgroundImage.src + ')' : '';
    if (_styleVal != null && _styleVal !== false) {
      out += " style=\"" + escapeAttr(_styleVal) + "\"";
    }
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
  for (const [_i, link] of ((props.links) ?? []).entries()) {
    out += "<a";
    out += " class=\"btn btn--sm btn--outline\"";
    {
      const _hrefVal: unknown = link.href;
      if (_hrefVal != null && _hrefVal !== false) {
        out += " href=\"" + escapeAttr(_hrefVal) + "\"";
      }
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
