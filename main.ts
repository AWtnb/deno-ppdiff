/*
Copyright 2024 AWtnb

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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

const toLineFeed = (s: string): string => {
    return s.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
};

const execDiff = async (
    origin: string,
    revised: string,
    outPath: string,
): Promise<number> => {
    const decoder = new TextDecoder("utf-8");
    const o = toLineFeed(decoder.decode(await Deno.readFile(origin)));
    const r = toLineFeed(decoder.decode(await Deno.readFile(revised)));

    const dmp = new diff_match_patch();
    dmp.Diff_Timeout = 0;
    const diff = dmp.diff_main(o, r);
    dmp.diff_cleanupSemanticLossless(diff);

    const title = sprintf("'%s'→'%s'", basename(origin), basename(revised));
    const dt = new DomTree(title, diff);
    const result = dt.Stringify();

    if (outPath.length < 1) {
        const outName = sprintf(
            "%s_diff_from_%s.html",
            toStem(revised),
            toStem(origin),
        );
        outPath = join(dirname(revised), outName);
    }
    if (!outPath.endsWith(".html")) {
        outPath += ".html";
    }

    await Deno.writeTextFile(outPath, result);
    return 0;
};

const main = async () => {
    const flags = parseArgs(Deno.args, {
        string: ["origin", "revised", "out"],
        default: {
            origin: "",
            revised: "",
            out: "",
        },
    });
    const invalids = [flags.origin, flags.revised].filter((p) => !exists(p));
    if (0 < invalids.length) {
        invalids.forEach((p) => {
            console.error("invalid path:", p);
        });
        Deno.exit(1);
    }
    const result = await execDiff(flags.origin, flags.revised, flags.out);
    Deno.exit(result);
};

main();
