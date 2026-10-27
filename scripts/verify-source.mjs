import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = JSON.parse(await readFile(path.join(root, "vendor/threeui/source-bundle.json"), "utf8"));
const required = {
  "src/shaders/landing-pages/LandingPages.tsx": "4d379461ad00eb4de7900df312878035383de7e1ed4e13283b8143a2eea9d30a",
  "src/shaders/landing-pages/pageTypography.ts": "809cc65797d531cd3b3ca5a56815d55d24b3ee8d293e4e4bad6fdfe6c83244cc",
  "src/shaders/landing-pages/pageRecipes.ts": "c9d9849cc255bac2d1d938d088c50917f84916f1c516d2bbb27fcfd803523233",
  "src/shaders/landing-pages/LandingPageFrame.tsx": "61de2cc50888aac4ac5557420b07fa47ed3543bb57c1e0055fafdefa53dbaa78",
  "public/landing-pages/meng-to-sketchbook.html": "e0330548b1ac905cf1b81698163ffa29f8a3a8c39b8d39f9b71ba5b9255b6dd1",
  "src/shaders/threeui.css": "efe4447139f1358dd8e9be68edf6fa46cbefbd1de423a4d6c439ca61d2c8eccf",
};
assert.equal(bundle.files.length, 6); assert.equal(bundle.assets.length, 17);
for (const item of [...bundle.files, ...bundle.assets]) {
  const local = item.path.startsWith("public/") ? item.path : `vendor/threeui/${item.path}`;
  const data = await readFile(path.join(root, local));
  assert.equal(data.byteLength, item.bytes, item.path);
  assert.equal(createHash("sha256").update(data).digest("hex"), required[item.path] ?? item.sha256, item.path);
}
const catalog = await readFile(path.join(root, "vendor/threeui/src/shaders/landing-pages/LandingPages.tsx"), "utf8");
const exportSource = catalog.match(/export function MengToSketchbookLandingPage\([\s\S]*?\n\}/)[0];
const entry = await readFile(path.join(root, "vendor/threeui/SketchbookEntry.tsx"), "utf8");
assert.equal(entry.slice(entry.indexOf("export function")).trim(), exportSource);
const scene = await readFile(path.join(root, "src/Scene.tsx"), "utf8");
for (const value of ['headingFont="instrument-serif"', 'bodyFont="newsreader"', 'headingWeight="400"', 'bodyWeight="400"', 'primaryColor="#2b2721"', 'headingSize={30}', 'bodySize={20}', 'headingLetterSpacing={0.010}']) assert.ok(scene.includes(value), value);
console.log("PASS: 6 registered sources, 17 binary assets, verbatim component export and all 8 configured props");
