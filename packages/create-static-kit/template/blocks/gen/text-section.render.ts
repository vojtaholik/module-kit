// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, type RenderBlockInput } from "@static-block-kit/core";
import { encodeSchemaAddress } from "@static-block-kit/core";

export function renderTextSection(input: RenderBlockInput): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { props, ctx, addr } = input as { props: any; ctx: typeof input.ctx; addr: typeof input.addr };
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--text section--tone-";
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
    out += " href=\"" + escapeAttr(props.cta.href) + "\"";
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
