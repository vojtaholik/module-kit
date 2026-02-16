// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, type RenderBlockInput } from "@static-block-kit/core";
import { encodeSchemaAddress } from "@static-block-kit/core";

export function renderHero(input: RenderBlockInput): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { props, ctx, addr } = input as { props: any; ctx: typeof input.ctx; addr: typeof input.addr };
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--hero section--tone-";
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
      out += " href=\"" + escapeAttr(props.primaryCta.href) + "\"";
      out += ">";
      out += escapeHtml(props.primaryCta.label);
      out += "</a>";
    }
    if (props.secondaryCta) {
      out += "<a";
      out += " class=\"btn btn--secondary\"";
      out += " href=\"" + escapeAttr(props.secondaryCta.href) + "\"";
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
