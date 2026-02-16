// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, type RenderBlockInput } from "@static-block-kit/core";
import { encodeSchemaAddress } from "@static-block-kit/core";

export function renderCard(input: RenderBlockInput): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { props, ctx, addr } = input as { props: any; ctx: typeof input.ctx; addr: typeof input.addr };
  let out = "";
  out += "<article";
  out += " class=\"card card--custom\"";
  out += " data-block-id=\"";
  out += escapeAttr(addr.blockId);
  out += "\"";
  out += " data-schema-address=\"";
  out += escapeAttr(encodeSchemaAddress(addr));
  out += "\"";
  out += ">";
  if (props.image) {
    out += "<div";
    out += " class=\"card__image\"";
    out += ">";
    out += "<img";
    out += " loading=\"lazy\"";
    out += " src=\"" + escapeAttr(props.image.src) + "\"";
    out += " alt=\"" + escapeAttr(props.image.alt) + "\"";
    out += ">";
    out += "</div>";
  }
  out += "<div";
  out += " class=\"card__body\"";
  out += ">";
  if (props.date) {
    out += "<time";
    out += " class=\"card__date\"";
    out += ">";
    out += escapeHtml(props.date);
    out += "</time>";
  }
  out += "<h3";
  out += " class=\"h3 card__title\"";
  out += ">";
  out += escapeHtml(props.title);
  out += "</h3>";
  if (props.excerpt) {
    out += "<p";
    out += " class=\"text-body card__excerpt\"";
    out += ">";
    out += escapeHtml(props.excerpt);
    out += "</p>";
  }
  out += "<a";
  out += " class=\"card__link\"";
  out += " href=\"" + escapeAttr(props.link.href) + "\"";
  out += ">";
  out += escapeHtml(props.link.label);
  out += "</a>";
  out += "</div>";
  out += "</article>";

  return out;
}
