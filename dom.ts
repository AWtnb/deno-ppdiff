// @ts-types="npm:@types/diff-match-patch"
import {
    Diff,
    DIFF_DELETE,
    DIFF_EQUAL,
    DIFF_INSERT,
} from "npm:diff-match-patch";

import { sprintf } from "jsr:@std/fmt/printf";
import { DOMParser, Element } from "jsr:@b-fuze/deno-dom";
import { escape } from "jsr:@std/html";

const CSS = `
#diff-container {
  width: 600px;
  margin: auto;
  font-family: "HackGen";
  font-size: 16px;
  line-height: 1.25;
  word-break: break-all;
}

ins {
  border-radius: 4px;
  background: #ffbebe;
  border: 1px solid tomato;
  text-decoration: none;
}

del {
  background: #a4e5ff;
  border: 1px solid #05374b;
  color: #929292;
}


.break::after {
  content: "\\21B5";
  color: #929292;
}
`;

// https://github.com/google/diff-match-patch/blob/62f2e689f498f9c92dbc588c58750addec9b1654/javascript/diff_match_patch_uncompressed.js#L1251
const toHtml = (diffs: Diff[]): string => {
    const html = [];
    const pattern_amp = /&/g;
    const pattern_lt = /</g;
    const pattern_gt = />/g;
    const pattern_para = /\n/g;
    const br = `<span class="break"></span><br>`;
    let i = 1;
    for (let x = 0; x < diffs.length; x++) {
        const op = diffs[x][0]; // Operation (insert, delete, equal)
        const data = diffs[x][1]; // Text of change.
        const text = data.replace(pattern_amp, "&amp;").replace(
            pattern_lt,
            "&lt;",
        ).replace(pattern_gt, "&gt;").replace(pattern_para, br);
        switch (op) {
            case DIFF_INSERT:
                html[x] = `<ins tabindex="${i}">` + text + "</ins>";
                i += 1;
                break;
            case DIFF_DELETE:
                html[x] = `<del tabindex="${i}" inert>` + text + "</del>";
                i += 1;
                break;
            case DIFF_EQUAL:
                html[x] = "<span>" + text + "</span>";
                break;
        }
    }
    return html.join("");
};

export class DomTree {
    private readonly root: Element;
    private readonly escapedTitle: string;

    constructor(title: string, diffs: Diff[]) {
        this.escapedTitle = escape(title);

        const markup = toHtml(diffs);
        const container = sprintf(
            `<div id="diff-container">%s%s</div>`,
            `<h1>${this.escapedTitle}</h1>`,
            markup,
        );
        const html = sprintf(
            "<html><head></head><body>%s</body></html>",
            container,
        );
        this.root = new DOMParser().parseFromString(html, "text/html")
            .documentElement!;
    }

    private SetLang() {
        this.root.setAttribute("lang", "ja");
    }

    private GetHead() {
        return this.root.getElementsByTagName("head")[0];
    }

    private SetMeta() {
        [
            `<meta charset="utf-8"/>`,
            `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"/>`,
        ].forEach((meta) => {
            this.GetHead().innerHTML += meta;
        });
    }

    private SetFavicon() {
        const faviconHex = "1f4dd";
        const svg = sprintf(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50%%" y="50%%" style="dominant-baseline:central;text-anchor:middle;font-size:90px;">&#x%s;</text></svg>`,
            faviconHex,
        );
        const markup = sprintf(
            `<link rel="icon" href="data:image/svg+xml,%s">`,
            encodeURIComponent(svg),
        );
        this.GetHead().innerHTML += markup;
    }

    private SetTitle() {
        this.GetHead().innerHTML += `<title>${this.escapedTitle}</title>`;
    }

    private SetCss() {
        this.GetHead().innerHTML += `<style>${CSS}</style>`;
    }

    Stringify(): string {
        this.SetLang();
        this.SetMeta();
        this.SetFavicon();
        this.SetTitle();
        this.SetCss();
        return ("<!DOCTYPE html>" + this.root.outerHTML);
    }
}
