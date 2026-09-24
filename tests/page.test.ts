import { describe, it, expect } from "vitest";
import { printTheShotComponent } from "../src/components/print-the-shot";
import { pageShell } from "../src/pages/layout";
import { transformScript } from "../src/api/transform";

/**
 * The plugin's page is CODE that travels as a STRING.
 *
 * Everything the browser runs is a template literal here, and a template literal
 * eats backslashes: writing \/ in a regex inside it produces / in the page, and
 * the page dies with a syntax error that no unit test of the transform logic
 * would ever notice. That happened — v1.5.1 shipped a page that would not render
 * at all — so the strings get parsed here now.
 *
 * `new Function(body)` parses a body without running it, which is exactly the
 * check wanted: syntax, not behaviour.
 */
function parses(label: string, source: string) {
  it(`${label} parses as JavaScript`, () => {
    expect(() => new Function(source)).not.toThrow();
  });
}

describe("page scripts", () => {
  parses("the component", printTheShotComponent);
  parses("the transform script", transformScript);

  it("the assembled page has exactly the scripts it says it has", () => {
    const html = pageShell(
      "Print The Shot",
      `<print-the-shot data-version="0.0.0"></print-the-shot>`,
      [transformScript, printTheShotComponent]
    );
    const scripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
    expect(scripts.length).toBe(2);
    // A literal </script> anywhere in a script body ends it early and the rest
    // becomes markup — silent, and it looks like the page just stops.
    for (const block of scripts) {
      const body = block.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
      expect(body).not.toContain("</script");
    }
  });

  it("the component registers the tags the page shell uses", () => {
    const html = pageShell(
      "Print The Shot",
      `<print-the-shot data-version="0.0.0"></print-the-shot>`,
      [transformScript, printTheShotComponent]
    );
    expect(html).toContain("<print-the-shot");
    expect(printTheShotComponent).toContain('customElements.define("print-the-shot"');
  });
});
