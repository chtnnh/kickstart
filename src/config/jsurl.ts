/**
 * JSURL parser — ported from StartTreeV2 (MIT, Bruno Jouhier)
 * https://github.com/AlexW00/StartTreeV2
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any;

function encode(s: string): string {
  return !/[^\w-.]/.test(s)
    ? s
    : s.replace(/[^\w-.]/g, (ch) => {
        if (ch === "$") return "!";
        const code = ch.charCodeAt(0);
        return code < 0x100
          ? "*" + ("00" + code.toString(16)).slice(-2)
          : "**" + ("0000" + code.toString(16)).slice(-4);
      });
}

export function stringify(v: JsonValue): string | undefined {
  const tmpAry: string[] = [];

  switch (typeof v) {
    case "number":
      return isFinite(v) ? "~" + v : "~null";
    case "boolean":
      return "~" + v;
    case "string":
      return "~'" + encode(v);
    case "object": {
      if (!v) return "~null";
      if (Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) {
          tmpAry[i] = stringify(v[i]) || "~null";
        }
        return "~(" + (tmpAry.join("") || "~") + ")";
      }
      const parts: string[] = [];
      for (const key in v) {
        if (Object.prototype.hasOwnProperty.call(v, key)) {
          const val = stringify(v[key]);
          if (val) parts.push(encode(key) + val);
        }
      }
      return "~(" + parts.join("~") + ")";
    }
    default:
      return undefined;
  }
}

const reserved: Record<string, JsonValue> = {
  true: true,
  false: false,
  null: null,
};

export function parse(s: string | null | undefined): JsonValue {
  if (!s) return s;
  s = s.replace(/%(25)*27/g, "'");
  let i = 0;
  const len = s.length;

  function eat(expected: string) {
    if (s!.charAt(i) !== expected)
      throw new Error(`bad JSURL syntax: expected ${expected}, got ${s!.charAt(i)}`);
    i++;
  }

  function decode(): string {
    let beg = i;
    let r = "";
    while (i < len) {
      const ch = s!.charAt(i);
      if (ch === "~" || ch === ")") break;
      switch (ch) {
        case "*":
          if (beg < i) r += s!.substring(beg, i);
          if (s!.charAt(i + 1) === "*") {
            r += String.fromCharCode(parseInt(s!.substring(i + 2, i + 6), 16));
            beg = i += 6;
          } else {
            r += String.fromCharCode(parseInt(s!.substring(i + 1, i + 3), 16));
            beg = i += 3;
          }
          break;
        case "!":
          if (beg < i) r += s!.substring(beg, i);
          r += "$";
          beg = ++i;
          break;
        default:
          i++;
      }
    }
    return r + s!.substring(beg, i);
  }

  function parseOne(): JsonValue {
    let result: JsonValue;
    eat("~");
    const ch = s!.charAt(i);
    switch (ch) {
      case "(":
        i++;
        if (s!.charAt(i) === "~") {
          result = [];
          if (s!.charAt(i + 1) === ")") i++;
          else {
            do {
              result.push(parseOne());
            } while (s!.charAt(i) === "~");
          }
        } else {
          result = {};
          if (s!.charAt(i) !== ")") {
            do {
              const key = decode();
              result[key] = parseOne();
            } while (s!.charAt(i) === "~" && ++i);
          }
        }
        eat(")");
        break;
      case "'":
        i++;
        result = decode();
        break;
      default: {
        const beg = i++;
        while (i < len && /[^)~]/.test(s!.charAt(i))) i++;
        const sub = s!.substring(beg, i);
        if (/[\d-]/.test(ch)) {
          result = parseFloat(sub);
        } else {
          result = reserved[sub];
          if (typeof result === "undefined")
            throw new Error("bad value keyword: " + sub);
        }
      }
    }
    return result;
  }

  return parseOne();
}
