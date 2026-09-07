// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, assetUrl, type TypedRenderInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress, registerBlockAssets, blockAssetMarker } from "@vojtaholik/static-kit-core";
import type { CarouselProps } from "../carousel.block.ts";

export function renderCarousel(input: TypedRenderInput<CarouselProps>): string {
  const { props, ctx, addr } = input;
  const asset = (path: string) => assetUrl(ctx, path);
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--carousel section--tone-";
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
  {
    const _hrefVal: unknown = asset('sprite.svg') + '#arrow-left';
    if (_hrefVal != null && _hrefVal !== false) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
  }
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
  {
    const _hrefVal: unknown = asset('sprite.svg') + '#arrow-right';
    if (_hrefVal != null && _hrefVal !== false) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
  }
  out += ">";
  out += "</use>";
  out += "</svg>";
  out += "</button>";
  out += "</div>";
  out += "<div";
  out += " data-carousel=\"\"";
  {
    const _classVal: unknown = 'carousel carousel--' + props.variant;
    if (_classVal != null && _classVal !== false) {
      out += " class=\"" + escapeAttr(_classVal) + "\"";
    }
  }
  out += ">";
  for (const [_i, item] of ((props.items) ?? []).entries()) {
    out += "<a";
    {
      const _hrefVal: unknown = item.href || '#';
      if (_hrefVal != null && _hrefVal !== false) {
        out += " href=\"" + escapeAttr(_hrefVal) + "\"";
      }
    }
    {
      const _classVal: unknown = 'carousel__card carousel__card--' + props.variant;
      if (_classVal != null && _classVal !== false) {
        out += " class=\"" + escapeAttr(_classVal) + "\"";
      }
    }
    out += ">";
    out += "<div";
    out += " class=\"carousel__card-image\"";
    out += ">";
    out += "<img";
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
