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

br {
  display: block;
  content: "";
  margin: 0.5em 0;
}
`;

export class DomTree {
    private readonly root: Element;
    private readonly escapedTitle: string;

    constructor(title: string, markup: string) {
        this.escapedTitle = escape(title);

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

    private SetTabIndex() {
        this.root.querySelectorAll("ins, del").forEach((elem, i) => {
            elem.setAttribute("tabindex", i + 1);
        });
    }

    private InertDel() {
        this.root.querySelectorAll("del").forEach((elem) => {
            elem.setAttribute("inert", "");
        });
    }

    private CleanupStyle() {
        this.root.querySelectorAll("ins, del").forEach((elem) => {
            elem.removeAttribute("style");
        });
    }

    Stringify(): string {
        this.SetLang();
        this.SetMeta();
        this.SetFavicon();
        this.SetTitle();
        this.SetCss();
        this.CleanupStyle();
        this.SetTabIndex();
        this.InertDel();
        return ("<!DOCTYPE html>" + this.root.outerHTML).replaceAll(
            "\u00B6",
            "\u21B5",
        );
    }
}
