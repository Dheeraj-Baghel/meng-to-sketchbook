# Verification - 27 October 2026

## Source and build

`npm install --no-audit --no-fund`, `npm run build` and strict TypeScript checking succeeded. The build gate verifies all 6 registered files, 17 binary assets, the verbatim component export and all 8 configured props. The final HTML is the requested SHA-256 e0330548b1ac revision, not the changed live document. The package is pinned by recorded provenance; app dependencies are locked by npm.

## Production browser verification

Native installed Google Chrome, production build, desktop 1440 x 1000, emulated touch phone 390 x 844 and reduced-motion desktop. Results are in [results.json](artifacts/testing/results.json).

Verified:

- local component/frame mount; served HTML and all seventeen asset hashes;
- injected typography, 30px Instrument Serif heading / 400 weight / 0.3px tracking, Newsreader body, #2b2721 ink and local font readiness;
- startup riffle settles on Marina Bay Skyline;
- all nine index buttons select the matching loaded image and caption;
- keyboard turns and wraparound in both directions;
- native page drag builds 18 nested curved strips / 36 front-back faces, then commits; short held drag cancels;
- zoom controls adjust the real book scale/readout, cap at 150%, floor at 90%, and disable appropriately;
- the authored double-click reset handler restores 100% (this specific check dispatches a DOM dblclick event; not a native physical double-click);
- magnifier toggle state/glass visibility, native drag to the actual page interior, masked 2.3x image copy, and turn-driven glass displacement;
- About/Journal inner-document navigation;
- phone startup without riffle, hidden loupe on coarse input, no horizontal overflow, native touch tap turn and index selection;
- reduced-motion startup and direct keyboard commits;
- no external runtime downloads, JavaScript/console errors or failed network responses in the final run.

Desktop, curled-page, magnifier and mobile screenshots were visually inspected by the agent using the image viewer.

## Inherited source issue (not patched)

**Side-arrow pointer clicks fail in the required revision.** Native pointerdown on the button bubbles to the stage, which calls `setPointerCapture`; pointerup and click are retargeted to `sbStage`, so the button's onclick never runs. Reproduced independently and in the browser suite. This is recorded as a known issue, not falsely counted as a passing arrow-click workflow. Keyboard arrows, direct page interactions and index selection remain available. The required canonical file remains byte-exact.

The source's social/profile/contact placeholder links are unchanged. The unused shared Fragment Mono CSS URL warns at build time; that font is not used or requested by this component.

## Test iteration boundaries

The initial browser run timed out while waiting for the swallowed side-arrow click. Added bounded waits and a separately reported known-source issue; did not modify the component or canonical source. A subsequent magnifier check assumed the initial glass location despite previous page turns moving it; corrected the test to use the actual current coordinates and tolerate scale settling. The final browser suite completes in one uninterrupted run.

No Safari/Firefox or physical device tests, deployment, manual screen-reader audit or long-running performance measurements were performed.
