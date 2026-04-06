// ==========================================
// HTML Sanitization Utility
// Regex-based sanitizer (Vercel serverless uyumlu)
// ==========================================

// İzin verilen tag'ler
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
  "figure", "figcaption",
  "span", "div", "section",
]);

// İzin verilen attribute'lar
const ALLOWED_ATTRS = new Set([
  "href", "src", "alt", "title", "loading",
  "target", "rel", "class", "width", "height",
]);

// Tehlikeli attribute pattern'leri
const DANGEROUS_ATTR_PATTERN = /^on\w+|javascript:|data:/i;

/**
 * Haber HTML içeriğini XSS'e karşı temizler.
 * Sadece güvenli tag ve attribute'lara izin verir.
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return "";

  // Script, style, iframe gibi tehlikeli tag'leri tamamen sil
  let clean = dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "")
    .replace(/<object\b[^>]*>.*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/<form\b[^>]*>.*?<\/form>/gi, "")
    .replace(/<input\b[^>]*>/gi, "")
    .replace(/<button\b[^>]*>.*?<\/button>/gi, "");

  // Her tag'i işle
  clean = clean.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, tagName, attrs) => {
    const tag = tagName.toLowerCase();
    
    // İzin verilmeyen tag'leri sil
    if (!ALLOWED_TAGS.has(tag)) {
      return "";
    }

    // Self-closing tag'ler
    if (match.startsWith("</")) {
      return `</${tag}>`;
    }

    // Attribute'ları filtrele
    const cleanAttrs: string[] = [];
    const attrRegex = /([a-z][a-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/gi;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";

      // İzin verilen ve tehlikeli olmayan attribute'lar
      if (ALLOWED_ATTRS.has(attrName) && !DANGEROUS_ATTR_PATTERN.test(attrValue)) {
        // href ve src için javascript: kontrolü
        if ((attrName === "href" || attrName === "src") && attrValue.toLowerCase().startsWith("javascript:")) {
          continue;
        }
        cleanAttrs.push(`${attrName}="${attrValue.replace(/"/g, "&quot;")}"`);
      }
    }

    // a tag'lerine güvenlik attribute'ları ekle
    if (tag === "a") {
      if (!cleanAttrs.some(a => a.startsWith("rel="))) {
        cleanAttrs.push('rel="noopener noreferrer nofollow"');
      }
      if (!cleanAttrs.some(a => a.startsWith("target="))) {
        cleanAttrs.push('target="_blank"');
      }
    }

    const attrStr = cleanAttrs.length > 0 ? " " + cleanAttrs.join(" ") : "";
    
    // Self-closing tag'ler için
    if (["br", "img", "hr"].includes(tag)) {
      return `<${tag}${attrStr} />`;
    }

    return `<${tag}${attrStr}>`;
  });

  return clean;
}
