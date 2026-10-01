# Audit status — 2026-10-01

This repository has a layered verification strategy. “PASS” below means the corresponding reproducible gate completed successfully on the 181 test machine on 2026-10-01.

## Mathematical certificate

- PASS — 24 vertices, 36 unique undirected edges, 8 nonagonal faces.
- PASS — all 72 face/vertex incidences satisfy the published plane equations exactly.
- PASS — every edge belongs to exactly two faces; every vertex has degree three and lies on three faces.
- PASS — orientability using the published face-orientation assignment.
- PASS — Euler characteristic `-4`, hence genus `3`.
- PASS — complete pairwise face adjacency: 20 pairs share one edge and 8 pairs share two.
- PASS — exhaustive `8! = 40,320` face-permutation check leaves exactly four full cell-complex automorphisms, the powers of the published order-four map `T`.
- PASS — exact `Fraction`-arithmetic geometry check: all eight faces are simple, and all 28 face pairs intersect exactly in their prescribed shared-edge sets with no unintended crossing interval or isolated contact.

## Rendering and presentation

- PASS — each nonagon triangulates to exactly seven triangles.
- PASS — projected polygon area equals the sum of triangle areas within floating-point error (`<= 1.78e-15` in the current data).
- PASS — Three.js runtime revision is r181.
- PASS — CAD Z-up view contract, paper-reference presets, opacity/depth handling and source-audited palette contract.
- PASS — extreme interactive zoom remains `0.035 … 100000` camera distance.

## Web/runtime integrity

- PASS — vendored Three.js files match the audited SHA-256 fingerprints recorded in `verify_web.mjs`.
- PASS — CSP/referrer hardening is present.
- PASS — scripts, styles and import-map runtime dependencies are local; no CDN runtime is required.
- PASS — no hard-coded external fetch/WebSocket endpoint.
- PASS — HTML ids are unique.
- PASS — all `target="_blank"` links carry `noopener noreferrer`.
- PASS — required toolbar controls and baseline ARIA hooks are present.
- PASS — no tracked `.github/workflows/` files, preserving the requested GitHub Pages branch-deploy workflow without GitHub Actions.
- PASS — basic tracked-secret pattern scan found no hits outside intentionally excluded documentation/vendor paths.

## Browser regression

The local Chromium/Playwright regression audit passed on desktop (`1440×1000`) and mobile (`390×844`):

- zero console errors,
- zero page errors,
- zero HTTP >= 400 responses,
- zero unexpected external runtime requests,
- no mobile horizontal overflow,
- Paper 1/2/3, CAD presets, mode reset and extreme zoom all functional.

The deployed GitHub Pages build is rechecked after merges.

## Public-source recheck

On 2026-10-01, the current arXiv abstract for `2609.17700` still states 24 vertices, 36 edges, eight planar simple nonagonal faces, complete pairwise face adjacency, orientability, no unintended intersections and `C4` symmetry.

The current Popular Science article dated 2026-09-29 still says “26 edges.” This repository follows the primary preprint and the independently reconstructed count of 36 edges.

Primary source: https://arxiv.org/abs/2609.17700

Secondary coverage: https://www.popsci.com/science/new-geometry-shape-polyhedron/

## Run the repository audit

On Windows PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\audit_all.ps1
```

The all-gates script invokes the exact topology, exact geometry, presentation, renderer and web-integrity verifiers, plus syntax, whitespace, no-Actions and basic secret-pattern guards.

## Evidence boundary

The exact mathematical realization is reproducible from the published coordinate certificate. The three Figure 1 camera views are presentation references; the paper/source archive does not publish camera metadata. Accordingly, Paper 1–3 are audited recreations, not claimed pixel-identical recovery of unpublished camera parameters.
