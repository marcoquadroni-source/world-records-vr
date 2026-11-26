# World Records Experience

A real-time 3D museum prototype with **43 exhibits in six sections**: people (6), animals (8), buildings and nature (6), vehicles and technology (8), prehistoric animals (5), and the solar system (10).

[Open the app](https://marcoquadroni-source.github.io/world-records-vr/)

The solar system includes all eight planets, plus the Moon and Sun. Saturn has a separate ring mesh. Planet imagery: Solar System Scope / INOVE, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), with per-file sources and hashes in RIGHTS.json. Three.js is MIT licensed; its notice is retained in THREE-LICENSE.txt.

Other exhibits use original schematic geometry: **illustrations, not photorealistic, anatomical, or engineering reconstructions**. People use generic measurement figures, not portraits. Values inherited from planning that have not been independently verified are visibly labelled. Published historical measurements do not promise a current record title.

Use the section selector, catalogue, and page arrows to browse. Comparison uses a common scale for the three visible measurements; the measurement types can differ. Default display scales each object separately. These are scale models, not life-size reconstructions or orbital spacing.

Local use: serve this folder over HTTP (for example `python3 -m http.server 8766`). Keep every file together in the root. No build step, account, analytics, paid API, or runtime CDN is required.

WebXR controller rays, fixed teleport points, snap turning, and an in-world category/page menu are implemented. **Quest 3 hardware behavior and sustained performance remain untested.** No hand tracking or Mixed Reality is claimed. See READ-ME.txt for actual validation and limitations.
