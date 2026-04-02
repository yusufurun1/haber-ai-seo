// ==========================================
// HTML Sanitization Utility
// XSS koruması için DOMPurify wrapper
// ==========================================

import DOMPurify from "isomorphic-dompurify";

/**
 * Haber HTML içeriğini XSS'e karşı temizler.
 * Sadece güvenli tag ve attribute'lara izin verir.
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return "";

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "figure", "figcaption",
      "span", "div", "section",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "loading",
      "target", "rel", "class",
      "width", "height",
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}
