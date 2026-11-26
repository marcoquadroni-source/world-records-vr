# World Records Experience

A real-time 3D museum prototype with **43 exhibits in six sections**: people (6), animals (8), buildings and nature (6), vehicles and technology (8), prehistoric animals (5), and the solar system (10).

[Open the app](https://marcoquadroni-source.github.io/world-records-vr/)

The exhibition hall features limestone arches, bronze trim, skylights and Poly Haven marble with a procedural stone fallback. Beveled stonework, column contact shadows and soft wall washes add depth to the photographed-material surfaces. Repeated hall elements are instanced and the static shadow map is refreshed when the exhibits change. Marble 01 by Rob Tuytel, Studio Small 03 by Greg Zaal, and Painted Wooden Bench by Kirill Sannikov are locally bundled [Poly Haven CC0 assets](https://polyhaven.com/license).

The solar system includes all eight planets, plus the Moon and Sun. Surface shading includes day and night, inferred rocky relief, Earth clouds and atmospheric light, and shadows between Saturn and its rings. Planet imagery: Solar System Scope / INOVE, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), with per-file sources and hashes in RIGHTS.json. Three.js is MIT licensed; its notice is retained in THREE-LICENSE.txt.

Saturn V uses the original textured GLB by [NASA / Michael D. Carbajal](https://science.nasa.gov/3d-resources/saturn-v/). The app loads it when its gallery page opens and displays a schematic model while loading or if the asset is unavailable.

Tyrannosaurus rex displays a [3D scan of a cast of SUE](https://www.fieldmuseum.org/page/sue-3d-model), © Field Museum of Natural History, [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). The model was reoriented, centered and reduced to 31,852 triangles in Blender. It is bundled for noncommercial use.

The Statue of Liberty uses a [textured CC0 model by Innerscene](https://www.innerscene.com/tools/library/3d-parts/statue-of-liberty-on-its-pedestal-c8a7318f), optimized in Blender.

The remaining exhibits use more detailed original schematic geometry: **illustrations, not photorealistic, anatomical, or engineering reconstructions**. The four named people have historical or documentary photographs in the fact card and VR panel, paired with generic 3D measurement figures. Photo credits and rights are listed in RIGHTS.json. Values inherited from planning that have not been independently verified are visibly labelled. Published historical measurements do not promise a current record title.

Use the section selector, catalogue, and page arrows to browse. Comparison uses a common scale for the three visible measurements; the measurement types can differ. Default display scales each object separately. These are scale models, not life-size reconstructions or orbital spacing.

Local use: serve this folder over HTTP (for example `python3 -m http.server 8766`). Keep every file together in the root. No build step, account, analytics, paid API, or runtime CDN is required.

The selected exhibit has a lit podium rim and a warm spotlight. WebXR starts at a close viewpoint in front of the selected exhibit, with a world-space fact panel and a visible controller hit point. Exhibit labels and floor rings teleport to viewing distances fitted to the models. An in-world menu supports category and page selection, comparison, and height adjustment. Users can also enter their height in centimetres in the web interface. Height sets the display scale and viewing distances and provides a ratio to the real-world exhibit measurement. **Quest 3 hardware behavior and sustained performance remain untested.** No hand tracking or Mixed Reality is claimed. See READ-ME.txt for actual validation and limitations.
