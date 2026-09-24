import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { utf8ByteLength } from "../src/utils/utf8";

/**
 * The backend runs in Decaid's embedded JS engine, not a browser.
 *
 * It has no TextEncoder — the upload proxy asked for one and the plugin log said
 * so — and no TextDecoder, atob or btoa either. These tests cover the piece that
 * replaced it, and guard the class of mistake: a web API reaching into code that
 * does not have one.
 */
describe("utf8ByteLength", () => {
  it("counts ASCII as one byte each", () => {
    expect(utf8ByteLength("")).toBe(0);
    expect(utf8ByteLength("upload")).toBe(6);
  });

  it("counts CJK as three bytes each", () => {
    // The case that matters: bean names and profile titles are Chinese, so the
    // string length and the byte length are far apart and a short
    // Content-Length truncates the body.
    const s = "超萃2.0";
    expect(s.length).toBe(5);
    expect(utf8ByteLength(s)).toBe(3 + 3 + 1 + 1 + 1);
  });

  it("counts an emoji as four bytes", () => {
    expect(utf8ByteLength("☕")).toBe(3);
    expect(utf8ByteLength("🎉")).toBe(4); // surrogate pair
    expect("🎉".length).toBe(2);
  });

  it("agrees with Buffer for a mixed string", () => {
    const s = '{"profile":{"title":"超萃2.0 🎉"},"n":1}';
    expect(utf8ByteLength(s)).toBe(Buffer.byteLength(s, "utf8"));
  });

  it("agrees with Buffer on random-ish mixed strings", () => {
    const parts = ["a", "é", "中", "🎉", "ß", "\t", "x"];
    let s = "";
    for (let i = 0; i < 200; i++) s += parts[i % parts.length];
    expect(utf8ByteLength(s)).toBe(Buffer.byteLength(s, "utf8"));
  });
});

describe("backend sources", () => {
  const backendFiles = ["src/plugin.ts", "src/api/transform.ts", "src/utils/utf8.ts"];

  it("do not use browser-only globals", () => {
    // Usage patterns, not bare names: the comment explaining why this engine has
    // no TextEncoder would otherwise be the thing that fails the test.
    const banned = [
      "new TextEncoder",
      "TextEncoder(",
      "new TextDecoder",
      "TextDecoder(",
      "atob(",
      "btoa(",
    ];
    for (const rel of backendFiles) {
      const source = readFileSync(join(__dirname, "..", rel), "utf-8");
      for (const pattern of banned) {
        expect(source, `${rel} uses ${pattern}`).not.toContain(pattern);
      }
    }
  });

  it("send every JSON upload body with a length header", () => {
    const source = readFileSync(join(__dirname, "..", "src/plugin.ts"), "utf-8");
    const posts = source.match(/method: "POST"/g) || [];
    const headers = source.match(/jsonPostHeaders\(payload\)/g) || [];
    expect(posts.length).toBeGreaterThan(0);
    // Both upload paths — the page proxy and auto-upload — must go through the
    // shared header helper; a bare `fetch` with a JSON body loses the header and
    // the print server silently saves an empty file.
    expect(headers.length).toBe(posts.length);
  });
});
