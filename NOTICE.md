# NOTICE

This repository contains an independent interactive implementation based on mathematical data published by Ruslan Mizhaev in:

> *Integer Realization of an Equivelar Octahedron of Genus 3*  
> arXiv:2609.17700 (September 2026)  
> https://arxiv.org/abs/2609.17700

## Attribution boundary

The MIT License in this repository applies to the independently written website and verification code.

The mathematical facts transcribed into `data.json` — including the published integer vertex coordinates, face walks, plane equations, adjacency multiplicities, and symmetry description — are attributed to the cited preprint. No claim of authorship over the underlying mathematical construction or paper is made here.

The repository intentionally does **not** redistribute the paper PDF, its LaTeX source archive, or its figures.

## Secondary coverage discrepancy

Popular Science coverage dated September 29, 2026 currently states 26 edges. The primary preprint states 36 edges, and the face-walk certificate reconstructs exactly 36 unique undirected edges. This implementation follows and independently verifies the primary-source value of 36.

## Third-party runtime

The viewer vendors selected files from Three.js r181 under `vendor/`. Three.js is distributed under the MIT License; the upstream license text is included as `vendor/THREE-LICENSE.txt`.
