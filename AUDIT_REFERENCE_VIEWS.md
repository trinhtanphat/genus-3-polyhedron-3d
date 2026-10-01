# Reference-view audit

## Primary-source evidence

The authoritative geometry is the coordinate certificate in Ruslan Mizhaev, *Integer Realization of an Equivelar Octahedron of Genus 3* (arXiv:2609.17700). The paper states that the data can be reproduced directly in computer algebra or CAD software. Its Figure 1 contains three representative views, while Figure 2 contains planar representatives of the two face orbits. A direct search of the supplied LaTeX source finds no camera, azimuth, elevation, perspective/orthographic, or CAD-program metadata.

The repository's `data.json` already matches all 24 published integer coordinates, all eight cyclic face walks, all eight supporting-plane equations, the adjacency multiplicity matrix, and the C4 generator. The exact geometry was therefore not replaced in this audit.


### Audited arXiv-source files

The local arXiv source used for this audit was not committed to the repository. SHA-256 fingerprints:

- `main.tex`: `0e8c300e6627511f619ea4bb8d47e60ea05e38110303c1c43975b13964dc2265`
- `figure1.png`: `ea4334737d2a45e9aa380016ded966ca9d52e1e213bb7ed447f72ca00231c428`
- `figure2.png`: `1a5b33779bb306060a064dc383c78d89e61a7e7853c81ec3a009f94fe70faf9c`

Raster sampling confirms the dominant Figure 2 colors are green RGB `(105,184,133)` (`#69b885`) and orange RGB `(211,126,62)` (`#d37e3e`). Figure 1 additionally uses dominant teal `#4b8f8f`, gold `#aa8f52`, magenta `#ba4f6f`, and blue `#6a7cb8`.

## What looked different

The previous viewer presentation used a Y-up camera convention and 72% transparent faces by default. That can make a strongly non-convex genus-3 surface look visually unlike CAD/paper screenshots even when its coordinates and incidence structure are correct.

This audit changes presentation, not the mathematical realization:

- CAD convention: Z is up for normal 3D views.
- Front = X-Z projection (look along Y).
- Right = Y-Z projection (look along X).
- Top = X-Y projection (look along Z).
- Default face opacity is 100%.
- Vertices and labels are off by default.
- Transparency remains available; depth writes are disabled automatically for transparent faces to reduce misleading occlusion artifacts.
- F1 is orange and F3 is green, matching the explicit colors in published Figure 2.
- Paper 1 / Paper 2 / Paper 3 provide paper-reference recreations. They switch to white background, flat source-sampled colors, no fog/tone mapping, and a narrow perspective to approximate the publication look. Exact camera metadata is not published, so they are explicitly not claimed to be pixel-identical.
- A fine grid search for Figure 1 view 2 over the sampled oblique neighborhood found the best tested raster-label score at approximately azimuth `44°`, elevation `-4°`, with horizontal mirroring; that direction is now used.

## Verification

Required exact checks remain unchanged and pass:

- 24 vertices, 36 edges, 8 nonagonal faces.
- 72/72 exact face-plane incidences.
- Two faces per edge; degree three at every vertex.
- Orientability and genus 3.
- 28/28 face-pair intersections equal exactly the prescribed shared-edge set.
- Full C4 automorphism verification.
- Three.js triangulation preserves all eight planar nonagons.

Browser regression testing on the 181 machine also passes after the presentation changes: extreme zoom remains 0.035 to 100000, wheel zoom works, desktop/mobile layouts remain within viewport bounds, and no console/page/HTTP errors were reported by the existing browser audit.

## Conclusion

The source-coordinate geometry was not found to be wrong. The main discrepancy was presentation/orientation relative to CAD and the paper's representative views. The viewer was adjusted so the first impression now follows CAD Z-up semantics and opaque reference-style faces, while preserving the exact published realization.


## Deeper source-image audit (October 1, 2026)

A second presentation audit was run against the original raster figures extracted from the arXiv source package, without adding those copyrighted figures to this repository.

The three-panel Figure 1 source raster is 2400×840. Its dominant flat colors are:
- teal #4b8f8f
- green #69b885
- gold #aa8f52
- magenta #ba4f6f
- blue #6a7cb8
- orange #d37e3e

Figure 2 directly identifies F1 as orange and F3 as green. Cross-view silhouette/color matching across Figure 1 then recovers:
- F4 = teal
- F5 = blue
- F7 = magenta
- F8 = gold

F2 and F6 are not exposed as dominant flat-color regions in the published reference panels, so the viewer deliberately keeps distinguishable fallback colors for those two faces instead of claiming unsupported source-exact colors.

### Reference directions

The source-image audit also corrected the earlier reference-camera guesses:

- **Paper 1**: recovered as the +Z projection.
- **Paper 3**: recovered as the +Y projection. The published raster has opposite horizontal handedness relative to the raw Three.js projection, so the viewer mirrors the projection only; model coordinates are never mirrored or changed.
- **Paper 2**: the paper does not publish camera metadata. A reproducible grid search against the source raster places the best calibrated recreation near azimuth 45°, elevation 0°. The viewer therefore labels it as a calibrated recreation, not an exact hidden camera parameter.

Paper-reference mode uses a white background, no fog, no lighting-dependent face shading, a narrow 12° FOV at long camera distance, and flat source-audited colors. Normal interactive mode remains perspective/CAD-style and visually richer.

## Historical and identification checks

The 2026 preprint itself says the construction is based on an earlier construction and preserves its incidence structure. Therefore this repository describes the 2026 work as an exact integer-coordinate **realization/certificate**, not as proof that the abstract structure originated in 2026.

A separate September 2026 paper by Gergely Röst and Viktor Vígh gives another eight-faced genus-3 polyhedron with the same counts and edge multiplicities, but explicitly says it is not combinatorially equivalent to Mizhaev's example and has D2 rather than Mizhaev's rotoreflection symmetry. Images of that second object should not be used as a visual reference for this repository.

## Meaning of "100%"

For the published coordinate certificate, the repository uses exact arithmetic and exhaustively verifies the stated combinatorial/topological properties. For presentation, the source-image audit now reproduces the recoverable axis directions, handedness and visible source colors.

The one intentional uncertainty is **Paper 2's exact camera metadata**, because no exact camera position/projection settings are published in the paper. Claiming a pixel-identical hidden camera would go beyond the available evidence. The viewer therefore says "calibrated recreation" explicitly.
