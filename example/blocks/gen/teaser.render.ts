// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, type RenderBlockInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress } from "@vojtaholik/static-kit-core";

export function renderTeaser(input: RenderBlockInput): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { props, ctx, addr } = input as { props: any; ctx: typeof input.ctx; addr: typeof input.addr };
  let out = "";
  out += "<a";
  out += " class=\"card\"";
  const _hrefVal = props.link.href;
  if (_hrefVal) {
    out += " href=\"" + escapeAttr(_hrefVal) + "\"";
  }
  out += ">";
  if (props.image) {
    out += "<div";
    out += " class=\"card__image\"";
    out += ">";
    out += "<img";
    out += " loading=\"lazy\"";
    const _srcVal = props.image.src;
    if (_srcVal) {
      out += " src=\"" + escapeAttr(_srcVal) + "\"";
    }
    const _altVal = props.image.alt;
    if (_altVal) {
      out += " alt=\"" + escapeAttr(_altVal) + "\"";
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
