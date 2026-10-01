# Genus-3 Equivelar Octahedron — Interactive 3D

**Live demo:** https://trinhtanphat.github.io/genus-3-polyhedron-3d/

Interactive browser visualization of the exact integer-coordinate realization published by **Ruslan Mizhaev** in the September 2026 preprint **“Integer Realization of an Equivelar Octahedron of Genus 3”** (arXiv:2609.17700).

This repository is an independent educational visualization built from the published mathematical data. It is not affiliated with the paper's author.

## What is being visualized

The published surface is an equivelar polyhedron of type `{9,3}`:

- 24 vertices
- 36 edges
- 8 planar simple nonagonal faces
- exactly 3 faces and 3 edges incident at every vertex
- Euler characteristic `χ = 24 - 36 + 8 = -4`
- orientable genus `g = 3`
- every pair of faces shares at least one edge
- 20 face pairs share one edge, 8 face pairs share two
- geometric symmetry group `C4`
- symmetry generator `T(x,y,z) = (y,-x,-z)`

The viewer uses the exact 24 integer coordinates, exact eight face walks, exact plane equations, and exact adjacency multiplicity matrix from the preprint. Triangles exist only as a GPU rendering detail after each planar nonagon is projected to 2D and triangulated; they do not change the mathematical boundary/incidence data.

## What the app is for

This is an interactive scientific visualization and verification companion for the exact genus-3 polyhedron realization published in the cited preprint. It lets a reader inspect the shape spatially, inspect the published exact certificate, and reproduce key combinatorial/geometric checks. It is not a CAD editor and not an artist's approximation.

## Viewer features

- Orbit and pan, plus extended-range zoom from extreme close-up to a very distant overview
- Dedicated Zoom + / Zoom − / Fit controls, plus wheel and touch-pinch zoom
- Reset plus CAD-style isometric/front/top/right presets (Z-up), and Paper 1/2/3 paper-reference recreations based on published Figure 1
- Paper-reference mode switches to white background, narrow-perspective/near-orthographic viewing, flat source-sampled colors, no fog and no tone mapping for cleaner visual comparison
- Opaque faces by default; transparency remains optional and uses safer depth handling
- Individual face colors with exact face metadata
- Clickable vertices with exact integer coordinates and incident faces
- Toggle faces, edges, vertices, and vertex labels
- Adjustable face transparency
- Isolate any selected face
- Step through the order-four symmetry `T`
- Face adjacency multiplicity matrix
- Live topology facts and Euler/genus explanation
- Responsive layout for desktop and mobile
- Static/no-build deployment suitable for GitHub Pages

## Published-reference mode

The normal viewer uses CAD-style Z-up perspective controls. The **Paper 1 / Paper 2 / Paper 3** presets switch to a separate comparison presentation: white background, flat unlit face colors, no fog, long camera distance and narrow FOV.

A source-raster audit of the original arXiv figures found:

- Paper 1: recovered +Z projection.
- Paper 3: recovered +Y projection with horizontal source-image handedness correction.
- Paper 2: calibrated near azimuth 45°, elevation 0°. Exact camera metadata is not published, so this is explicitly a calibrated recreation rather than a pixel-identical camera claim.
- Figure 2 directly identifies F1 orange and F3 green.
- Cross-view matching in Figure 1 recovers F4 teal, F5 blue, F7 magenta and F8 gold.
- F2/F6 remain deliberate fallback colors because the published panels do not expose them as dominant flat-color fields.

See [AUDIT_REFERENCE_VIEWS.md](./AUDIT_REFERENCE_VIEWS.md) for the evidence boundary and the deeper reference-view audit.

The 2026 preprint describes this as an integer-coordinate realization based on an earlier construction; this repository therefore does not claim the abstract structure was first conceived in 2026. A different 2026 eight-faced genus-3 example by Röst and Vígh has the same face/edge counts but is explicitly not combinatorially equivalent to Mizhaev's example.

## Published-figure audit boundary

The arXiv LaTeX source includes `figure1.png` with the caption “Representative views of the integer realization” and `figure2.png` with the caption “Planar representatives of the two face orbits.” It does **not** contain camera, azimuth, elevation, perspective/orthographic, or CAD-program metadata. Therefore the exact mathematical realization can be reproduced from coordinates/face walks, but a pixel-identical recovery of the author's three Figure 1 cameras is not justified by the published source.

For reference rendering, this project samples the source raster palette. Figure 2's dominant green is RGB `(105,184,133)` / `#69b885`; the dominant orange is RGB `(211,126,62)` / `#d37e3e`. The other Figure 1 source colors used for the paper-style palette include teal `#4b8f8f`, gold `#aa8f52`, magenta `#ba4f6f`, and blue `#6a7cb8`.

A fine raster-comparison sweep for Figure 1 view 2 found its best tested match near azimuth `44°`, elevation `-4°`, with horizontal mirroring; the viewer uses that calibrated direction. This remains a reconstruction rather than recovered camera metadata.

See `AUDIT_REFERENCE_VIEWS.md` for the primary-source hashes and audit details.

## Exact verification

For the complete repository audit on Windows PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\audit_all.ps1
```

The full audit runs the exact topology and pairwise-geometry checks, the presentation contract, the actual vendored Three.js triangulation check, web/runtime-integrity checks, JavaScript syntax, `git diff --check`, the no-GitHub-Actions guard, and a basic tracked-secret pattern scan. See [AUDIT_STATUS.md](./AUDIT_STATUS.md) for the latest gate summary.

Individual dependency-free verifiers can also be run directly:

```bash
node verify.mjs
python verify_geometry.py
python verify_source.py   # optional: runs when ignored arXiv source files are present locally
node verify_presentation.mjs
node verify_render.mjs
node verify_web.mjs
```

`verify.mjs` checks the exact combinatorial/algebraic certificate:

1. 24 vertices and 8 faces
2. every face has exactly 9 vertices
3. all 72 face-vertex incidences satisfy the corresponding plane equation exactly
4. 36 unique undirected edges
5. every edge belongs to exactly 2 faces
6. every vertex has degree 3 and belongs to 3 faces
7. the published orientation assignment `(+,+,-,-,-,-,+,+)` reverses every shared edge, establishing orientability
8. `χ = -4` and `g = 3`
9. the face adjacency multiplicity matrix matches the published matrix
10. all 28 face pairs are adjacent: 20 once and 8 twice
11. `T(x,y,z)=(y,-x,-z)` preserves the vertex set, maps faces through the published two 4-cycles, and satisfies `T^4 = id`
12. an exhaustive enumeration of all `8! = 40,320` face permutations first finds 8 candidates preserving face-vertex incidence, then exactly 4 that also preserve every cyclic face boundary / edge incidence; those four are precisely the powers of `T`, so the full cell-complex automorphism group — and therefore the geometric symmetry group — is exactly `C4`

`verify_geometry.py` uses Python's exact `Fraction` arithmetic to independently check that all eight projected face boundaries are simple polygons and that every one of the 28 face pairs intersects **only** in the prescribed shared edge set, with no extra crossing interval or isolated contact.

## Run locally

The app uses ES modules, so serve the folder over HTTP instead of opening `index.html` with `file://`.

With Python:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/`.

No npm install or build step is required. The exact Three.js r181 runtime files used by the viewer are vendored under `vendor/` with their upstream MIT license, so the deployed viewer has no runtime CDN dependency.

## GitHub Pages without GitHub Actions

This project is intended to be published directly from the `main` branch root using GitHub Pages' branch/legacy source.

In the GitHub UI:

1. **Settings → Pages**
2. **Build and deployment → Source: Deploy from a branch**
3. Branch: **main**
4. Folder: **/(root)**

No `.github/workflows/` file is used or required.

The site can also be enabled with the GitHub API using the legacy branch source.

## Sources

- Ruslan Mizhaev, *Integer Realization of an Equivelar Octahedron of Genus 3*, arXiv:2609.17700, September 2026  
  https://arxiv.org/abs/2609.17700
- Popular Science coverage, September 29, 2026  
  https://www.popsci.com/science/new-geometry-shape-polyhedron/

### Source discrepancy: 36 edges vs. 26

The primary arXiv preprint states **36 edges**, and the exact face walks in the coordinate certificate reconstruct 36 unique undirected edges. The Popular Science headline/body currently says **26 edges**. This project follows the primary preprint and independently verifies the 36-edge count.

The mathematical coordinate and incidence facts are attributed to the original preprint. All website code in this repository is independently written. See `NOTICE.md` for the source-data attribution boundary.

## License

Website code: MIT License.

Mathematical facts and published source data are cited to their original source. This repository does not redistribute the paper PDF, arXiv source archive, or paper figures.
