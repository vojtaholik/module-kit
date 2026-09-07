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
  out += ">";
  out += "<div";
  out += " class=\"";
  out += "container container--";
  out += escapeAttr(ctx.layout.contentWidth);
  out += "\"";
  out += ">";
  out += "<div";
  out += " class=\"";
  out += "hero__content hero__content--";
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
  out += "<h1";
  out += " class=\"h1 hero__headline\"";
  out += ">";
  out += escapeHtml(props.headline);
  out += "</h1>";
  if (props.subheadline) {
    out += "<p";
    out += " class=\"text-body hero__subheadline\"";
    out += ">";
    out += escapeHtml(props.subheadline);
    out += "</p>";
  }
  if (props.primaryCta || props.secondaryCta) {
    out += "<div";
    out += " class=\"hero__actions\"";
    out += ">";
    if (props.primaryCta) {
      out += "<a";
      out += " class=\"btn btn--primary\"";
      {
        const _hrefVal: unknown = props.primaryCta.href;
        if (_hrefVal != null && _hrefVal !== false) {
          out += " href=\"" + escapeAttr(_hrefVal) + "\"";
        }
      }
      out += ">";
      out += escapeHtml(props.primaryCta.label);
      out += "</a>";
    }
    if (props.secondaryCta) {
      out += "<a";
      out += " class=\"btn btn--secondary\"";
      {
        const _hrefVal: unknown = props.secondaryCta.href;
        if (_hrefVal != null && _hrefVal !== false) {
          out += " href=\"" + escapeAttr(_hrefVal) + "\"";
        }
      }
      out += ">";
      out += escapeHtml(props.secondaryCta.label);
      out += "</a>";
    }
    out += "</div>";
  }
  out += "</div>";
  out += "</div>";
  out += "</section>";

  return out;
}
