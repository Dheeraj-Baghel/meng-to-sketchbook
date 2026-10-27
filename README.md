# Meng To - Singapore Sketchbook

Standalone React/TypeScript/Vite integration of ThreeUI's `MengToSketchbookLandingPage`, using the exact configured props and registered source. Other workspace applications are not referenced or changed.

**Live: https://meng-to-sketchbook-three.vercel.app**
(private source: https://github.com/Dheeraj-Baghel/meng-to-sketchbook; pushes to `main` deploy automatically)

**Local preview: http://127.0.0.1:4335/**

## Run

Requires Node 24. From this folder:

```sh
npm ci
npm run dev
```

For a production preview: `npm run build` then `npm run preview`.
Verification: `npm run verify:source`, `npm run typecheck`, `npm run test:browser` (requires installed Google Chrome; serves production output on test-only port 4336).

## Exact-source contract

- [Scene](src/Scene.tsx) uses the supplied `@designcodeio/threeui` component/style imports and all eight configured props without alteration.
- [Vite aliases](vite.config.ts) resolve those imports to independent vendored source, not another application or the ThreeUI documentation page.
- [Sketchbook entry](vendor/threeui/SketchbookEntry.tsx) contains the registered component export verbatim, with its three required imports. Unrelated catalog scene imports are excluded; the complete original registered files are retained unchanged.
- [Canonical HTML](public/landing-pages/meng-to-sketchbook.html) is **45,528 bytes**, SHA-256 **e0330548b1ac905cf1b81698163ffa29f8a3a8c39b8d39f9b71ba5b9255b6dd1**. It owns the DOM, CSS, curved page animation, input, loupe, responsive layout and index.
- All six registered files and seventeen binary assets pass size/hash verification. HTML and binary bytes come from `@designcodeio/threeui@1.2.0`; registered executable text comes from the complete source bundle. The live HTML URL had a different revision and was not substituted.
- The original frame loads the local authored HTML at `/landing-pages/meng-to-sketchbook.html`; typography is appended at runtime by the unchanged ThreeUI controls, not rewritten into that HTML.
- [Provenance](vendor/threeui/provenance.json), [source bundle](vendor/threeui/source-bundle.json), [MIT license](vendor/threeui/LICENSE), [asset licenses](vendor/threeui/ASSET-LICENSES.md), [font licenses](vendor/threeui/FONT-LICENSES.md) and [third-party notices](vendor/threeui/THIRD_PARTY_NOTICES.md) are retained.

## Verification and limitations

See [verification](VERIFICATION.md), [browser results](artifacts/testing/results.json), [desktop](artifacts/testing/desktop.png), [page curl](artifacts/testing/curled-page.png), [magnifier](artifacts/testing/magnifier.png), [editorial index](artifacts/testing/editorial-index.png) and [phone-sized preview](artifacts/testing/mobile.png).

**Known original-source issue:** pointer clicks on the side arrows are swallowed by `sbStage` pointer capture. Keyboard Left/Right, page taps/drags and index selection work. This was reproduced with native input and documented rather than patched, to honor the exact-source requirement. Side buttons can also be keyboard-activated. Placeholder social/contact/bio links are preserved as authored; no real contact integration is implied.

The shared CSS references an unused Fragment Mono font that is absent from the published package; Vite reports an unresolved URL. This sketchbook uses its verified local Instrument Serif and Newsreader fonts instead. No missing font request or external runtime download occurred in the browser checks.

No deployment, backend, account or paid service was added. Physical devices, Safari/Firefox, human accessibility and long-duration performance remain unverified.
