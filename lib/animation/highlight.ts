export type TokenKind =
  | "keyword"
  | "string"
  | "comment"
  | "number"
  | "function"
  | "property"
  | "punct"
  | "text";

export interface Token {
  kind: TokenKind;
  text: string;
}

const JS_KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "import",
  "from",
  "export",
  "default",
  "new",
  "class",
  "async",
  "await",
  "for",
  "while",
  "do",
  "of",
  "in",
  "typeof",
  "instanceof",
  "null",
  "true",
  "false",
  "undefined",
  "this",
  "as",
  "type",
  "interface",
  "extends",
  "implements",
  "static",
  "public",
  "private",
  "protected",
  "readonly",
]);

const JS_TOKEN =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b-?\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][A-Za-z0-9_$]*\b)|(\s+)|([{}()[\],;:.<>=+\-*/!?|&~%^]+)/g;

export function tokenizeJs(source: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  JS_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = JS_TOKEN.exec(source)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ kind: "text", text: source.slice(lastIndex, m.index) });
    }
    const [, comment, str, num, ident, ws, punct] = m;
    if (comment !== undefined) tokens.push({ kind: "comment", text: comment });
    else if (str !== undefined) tokens.push({ kind: "string", text: str });
    else if (num !== undefined) tokens.push({ kind: "number", text: num });
    else if (ident !== undefined) {
      if (JS_KEYWORDS.has(ident)) {
        tokens.push({ kind: "keyword", text: ident });
      } else {
        const next = source[m.index + ident.length];
        tokens.push({ kind: next === "(" ? "function" : "text", text: ident });
      }
    } else if (ws !== undefined) tokens.push({ kind: "text", text: ws });
    else if (punct !== undefined) tokens.push({ kind: "punct", text: punct });
    lastIndex = JS_TOKEN.lastIndex;
  }
  if (lastIndex < source.length) {
    tokens.push({ kind: "text", text: source.slice(lastIndex) });
  }
  return tokens;
}

const CSS_TOKEN =
  /(\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(@[A-Za-z-]+)|(\b-?\d+(?:\.\d+)?(?:px|rem|em|%|deg|ms|s|vw|vh|fr)?\b)|(#[0-9a-fA-F]{3,8}\b)|([A-Za-z-][A-Za-z0-9-]*)(?=\s*:)|(\b[A-Za-z-][A-Za-z0-9-]*\b)|(\s+)|([{}()[\],;:.<>=+\-*/!?|&~%^]+)/g;

export function tokenizeCss(source: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  CSS_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CSS_TOKEN.exec(source)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ kind: "text", text: source.slice(lastIndex, m.index) });
    }
    const [, comment, str, atRule, num, hex, prop, ident, ws, punct] = m;
    if (comment !== undefined) tokens.push({ kind: "comment", text: comment });
    else if (str !== undefined) tokens.push({ kind: "string", text: str });
    else if (atRule !== undefined) tokens.push({ kind: "keyword", text: atRule });
    else if (num !== undefined) tokens.push({ kind: "number", text: num });
    else if (hex !== undefined) tokens.push({ kind: "number", text: hex });
    else if (prop !== undefined) tokens.push({ kind: "property", text: prop });
    else if (ident !== undefined) tokens.push({ kind: "text", text: ident });
    else if (ws !== undefined) tokens.push({ kind: "text", text: ws });
    else if (punct !== undefined) tokens.push({ kind: "punct", text: punct });
    lastIndex = CSS_TOKEN.lastIndex;
  }
  if (lastIndex < source.length) {
    tokens.push({ kind: "text", text: source.slice(lastIndex) });
  }
  return tokens;
}

export function tokenize(source: string, lang: "js" | "css"): Token[] {
  return lang === "css" ? tokenizeCss(source) : tokenizeJs(source);
}
