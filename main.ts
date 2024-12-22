// @ts-types="npm:@types/diff-match-patch"
import { diff_match_patch } from "npm:diff-match-patch";

import { parseArgs } from "jsr:@std/cli/parse-args";
import { exists } from "jsr:@std/fs";
import { basename, dirname, extname, join } from "jsr:@std/path";

import { DomTree } from "./dom.ts";
import { sprintf } from "jsr:@std/fmt/printf";

const toStem = (path: string): string => {
    return basename(path, extname(path));
};

const execDiff = async (
    origin: string,
    revised: string,
): Promise<number> => {
    const decoder = new TextDecoder("utf-8");
    const o = decoder.decode(await Deno.readFile(origin));
    const r = decoder.decode(await Deno.readFile(revised));

    const dmp = new diff_match_patch();
    const diff = dmp.diff_main(o, r);
    dmp.diff_cleanupSemantic(diff);
    const markup = dmp.diff_prettyHtml(diff);

    const title = sprintf("'%s'→'%s'", basename(origin), basename(revised));
    const dt = new DomTree(title, markup);
    const result = dt.Stringify();

    const outName = sprintf(
        "%s_diff_from_%s.html",
        toStem(revised),
        toStem(origin),
    );
    const outPath = join(dirname(revised), outName);

    await Deno.writeTextFile(outPath, result);
    return 0;
};

const main = async () => {
    const flags = parseArgs(Deno.args, {
        string: ["origin", "revised"],
        default: {
            origin: "",
            revised: "",
        },
    });
    const invalids = [flags.origin, flags.revised].filter((p) => !exists(p));
    if (0 < invalids.length) {
        invalids.forEach((p) => {
            console.error("invalid path:", p);
        });
        Deno.exit(1);
    }
    const result = await execDiff(flags.origin, flags.revised);
    Deno.exit(result);
};

main();
