// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, type RenderBlockInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress } from "@vojtaholik/static-kit-core";

export function renderBusinessCard(input: RenderBlockInput): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { props, ctx, addr } = input as { props: any; ctx: typeof input.ctx; addr: typeof input.addr };
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--tone-";
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
  out += " class=\"container container--wide\"";
  out += ">";
  out += "<div";
  out += " class=\"business-card\"";
  out += ">";
  if (props.contactPerson?.image) {
    out += "<div";
    out += " class=\"business-card__image\"";
    out += ">";
    out += "<img";
    out += " loading=\"lazy\"";
    const _srcVal = props.contactPerson.image.src;
    if (_srcVal) {
      out += " src=\"" + escapeAttr(_srcVal) + "\"";
    }
    const _altVal = props.contactPerson.image.alt;
    if (_altVal) {
      out += " alt=\"" + escapeAttr(_altVal) + "\"";
    }
    out += ">";
    out += "<div";
    out += " class=\"business-card__image-overlay\"";
    out += ">";
    out += "</div>";
    out += "</div>";
  }
  out += "<div";
  out += " class=\"business-card__container\"";
  out += ">";
  out += "<div";
  out += " class=\"business-card__content\"";
  out += ">";
  out += "<div";
  out += " class=\"business-card__text\"";
  out += ">";
  out += "<h2";
  out += " class=\"business-card__headline\"";
  out += ">";
  out += escapeHtml(props.headline);
  out += "</h2>";
  if (props.body) {
    out += "<p";
    out += " class=\"business-card__body\"";
    out += ">";
    out += escapeHtml(props.body);
    out += "</p>";
  }
  out += "</div>";
  out += "<div";
  out += " class=\"business-card__footer\"";
  out += ">";
  out += "<div";
  out += " class=\"business-card__actions\"";
  out += ">";
  out += "<a";
  out += " class=\"btn btn--gold\"";
  const _hrefVal = props.primaryCta.href;
  if (_hrefVal) {
    out += " href=\"" + escapeAttr(_hrefVal) + "\"";
  }
  out += ">";
  out += escapeHtml(props.primaryCta.label);
  out += "</a>";
  for (const [_i, link] of (props.contactLinks).entries()) {
    out += "<a";
    out += " class=\"btn btn--outline-light\"";
    const _hrefVal = link.href;
    if (_hrefVal) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
    out += ">";
    out += escapeHtml(link.label);
    out += "</a>";
  }
  out += "</div>";
  if (props.contactPerson) {
    out += "<div";
    out += " class=\"business-card__contact\"";
    out += ">";
    out += "<p";
    out += " class=\"business-card__contact-name\"";
    out += ">";
    out += escapeHtml(props.contactPerson.name);
    out += "</p>";
    out += "<p";
    out += " class=\"business-card__contact-title\"";
    out += ">";
    out += escapeHtml(props.contactPerson.title);
    out += "</p>";
    if (props.contactPerson.regions) {
      out += "<p";
      out += " class=\"business-card__contact-regions\"";
      out += ">";
      out += escapeHtml(props.contactPerson.regions);
      out += "</p>";
    }
    out += "</div>";
  }
  out += "</div>";
  out += "</div>";
  out += "</div>";
  out += "</div>";
  out += "</div>";
  out += "</section>";

  return out;
}
