# Reference-view audit

## Primary-source evidence

The authoritative geometry is the coordinate certificate in Ruslan Mizhaev, *Integer Realization of an Equivelar Octahedron of Genus 3* (arXiv:2609.17700). The paper states that the data can be reproduced directly in computer algebra or CAD software. Its Figure 1 contains three representative views, while Figure 2 shows planar representatives of F3 and F1.

The repository's `data.json` already matches all 24 published integer coordinates, all eight cyclic face walks, all eight supporting-plane equations, the adjacency multiplicity matrix, and the C4 generator. The exact geometry was therefore not replaced in this audit.

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
- Paper 1 / Paper 2 / Paper 3 provide recreated/calibrated directions based on published Figure 1. Exact camera metadata is not published, so these are not claimed to be pixel-identical.

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
