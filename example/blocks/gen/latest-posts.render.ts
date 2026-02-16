// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, type RenderBlockInput } from "@vojtaholik/static-kit-core";
import { encodeSchemaAddress } from "@vojtaholik/static-kit-core";

export function renderLatestPosts(input: RenderBlockInput): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { props, ctx, addr } = input as { props: any; ctx: typeof input.ctx; addr: typeof input.addr };
  let out = "";
  out += "<section";
  out += " class=\"";
  out += "section section--latest-posts section--tone-";
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
  out += "section__header section__header--";
  out += escapeAttr(ctx.layout.contentAlign);
  out += "\"";
  out += ">";
  if (props.headline) {
    out += "<h2";
    out += " class=\"h2\"";
    out += ">";
    out += escapeHtml(props.headline);
    out += "</h2>";
  }
  if (props.subheadline) {
    out += "<p";
    out += " class=\"text-body\"";
    out += ">";
    out += escapeHtml(props.subheadline);
    out += "</p>";
  }
  out += "</div>";
  out += "<div";
  out += " class=\"grid grid--3\"";
  out += ">";
  for (const [i, post] of (props.posts).entries()) {
    out += "<article";
    out += " class=\"card card--post\"";
    out += ">";
    if (post.image) {
      out += "<div";
      out += " class=\"card__image\"";
      out += ">";
      out += "<img";
      out += " loading=\"lazy\"";
      const _srcVal = post.image.src;
      if (_srcVal) {
        out += " src=\"" + escapeAttr(_srcVal) + "\"";
      }
      const _altVal = post.image.alt;
      if (_altVal) {
        out += " alt=\"" + escapeAttr(_altVal) + "\"";
      }
      out += ">";
      out += "</div>";
    }
    out += "<div";
    out += " class=\"card__body\"";
    out += ">";
    if (post.date) {
      out += "<time";
      out += " class=\"card__date\"";
      out += ">";
      out += escapeHtml(post.date);
      out += "</time>";
    }
    out += "<h3";
    out += " class=\"h3 card__title\"";
    out += ">";
    out += escapeHtml(post.title);
    out += "</h3>";
    if (post.excerpt) {
      out += "<p";
      out += " class=\"text-body card__excerpt\"";
      out += ">";
      out += escapeHtml(post.excerpt);
      out += "</p>";
    }
    out += "<a";
    out += " class=\"card__link\"";
    const _hrefVal = post.link.href;
    if (_hrefVal) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
    out += ">";
    out += escapeHtml(post.link.label);
    out += "</a>";
    out += "</div>";
    out += "</article>";
  }
  out += "</div>";
  if (props.viewAllLink) {
    out += "<div";
    out += " class=\"section__footer\"";
    out += ">";
    out += "<a";
    out += " class=\"btn btn--secondary\"";
    const _hrefVal = props.viewAllLink.href;
    if (_hrefVal) {
      out += " href=\"" + escapeAttr(_hrefVal) + "\"";
    }
    out += ">";
    out += escapeHtml(props.viewAllLink.label);
    out += "</a>";
    out += "</div>";
  }
  out += "</div>";
  out += "</section>";

  return out;
}
