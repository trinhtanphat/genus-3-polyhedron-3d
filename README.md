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

## Viewer features

- Orbit, zoom, reset, isometric/front/top/side camera presets
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

## Exact verification

Run:

```bash
node verify.mjs
```

The verifier checks with integer arithmetic:

1. 24 vertices and 8 faces
2. every face has exactly 9 vertices
3. all 72 face-vertex incidences satisfy the corresponding plane equation exactly
4. 36 unique undirected edges
5. every edge belongs to exactly 2 faces
6. every vertex has degree 3 and belongs to 3 faces
7. `χ = -4` and `g = 3`
8. the face adjacency multiplicity matrix matches the paper
9. all 28 face pairs are adjacent: 20 once and 8 twice
10. `T` preserves the vertex set and `T^4 = id`

## Run locally

The app uses ES modules, so serve the folder over HTTP instead of opening `index.html` with `file://`.

With Python:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/`.

No npm install or build step is required. Three.js is loaded from jsDelivr.

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

The mathematical coordinate and incidence facts are attributed to the original preprint. All website code in this repository is independently written.

## License

Website code: MIT License.

Mathematical facts and published source data are cited to their original source. This repository does not redistribute the paper PDF, arXiv source archive, or paper figures.
