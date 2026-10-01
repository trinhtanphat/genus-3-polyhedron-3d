import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEX = ROOT / "main.tex"
DATA = ROOT / "data.json"

if not TEX.exists():
    print("SKIP: main.tex is not present. The arXiv source is intentionally ignored and not redistributed.")
    raise SystemExit(0)

tex = TEX.read_text(encoding="utf-8")
data = json.loads(DATA.read_text(encoding="utf-8"))

# Optional local-source fingerprints used for this audit snapshot.
expected_hashes = {
    "main.tex": "0e8c300e6627511f619ea4bb8d47e60ea05e38110303c1c43975b13964dc2265",
    "figure1.png": "ea4334737d2a45e9aa380016ded966ca9d52e1e213bb7ed447f72ca00231c428",
    "figure2.png": "1a5b33779bb306060a064dc383c78d89e61a7e7853c81ec3a009f94fe70faf9c",
    "arxiv-source.tar": "e5029e31faf03c92c2ca3bf3e5dec65036364900008046f1435008f745de7840",
}
for name, expected in expected_hashes.items():
    p = ROOT / name
    if p.exists():
        actual = hashlib.sha256(p.read_bytes()).hexdigest()
        assert actual == expected, f"{name}: source fingerprint changed: {actual}"
print("PASS: available local arXiv-source files match the audited SHA-256 snapshot.")

# Parse the two-record-per-row vertex table.
vertex_section = tex.split(r"\caption{Integer coordinates of the 24 vertices.}", 1)[1].split(r"\end{table}", 1)[0]
vertex_pattern = re.compile(
    r"(?m)^(\d+)&(-?\d+)&(-?\d+)&(-?\d+)&(\d+)&(-?\d+)&(-?\d+)&(-?\d+)\\\\$"
)
vertices = {}
for match in vertex_pattern.finditer(vertex_section):
    values = list(map(int, match.groups()))
    vertices[values[0]] = values[1:4]
    vertices[values[4]] = values[5:8]
assert len(vertices) == 24, f"parsed {len(vertices)} vertices instead of 24"
assert {str(k): v for k, v in sorted(vertices.items())} == data["vertices"]
print("PASS: data.json vertices match all 24 integer coordinates in main.tex exactly.")

# Parse the eight plane equations directly from the source.
plane_pattern = re.compile(r"(?m)^F_(\d):&\\quad\s*([^,\.\r\n]+?)[,\.](?:\\\\)?$")
planes = {}
for match in plane_pattern.finditer(tex):
    planes[f"F{match.group(1)}"] = match.group(2).replace(" ", "")
assert len(planes) == 8, f"parsed {len(planes)} face planes instead of 8"
data_planes = {f["id"]: f["plane"]["text"].replace(" ", "") for f in data["faces"]}
assert data_planes == planes, (data_planes, planes)
print("PASS: data.json plane equations match all 8 source equations exactly.")

# Parse the eight cyclic nonagonal face walks.
faces = {}
for fid, walk in re.findall(r"\$(F_\d)\$\s*&\s*\$([0-9-]+)\$\\\\", tex):
    faces[fid.replace("_", "")] = list(map(int, walk.split("-")))
assert len(faces) == 8, f"parsed {len(faces)} face walks instead of 8"
assert {f["id"]: f["walk"] for f in data["faces"]} == faces
print("PASS: data.json face walks match all 8 published nonagonal walks exactly.")

# Parse the 8x8 adjacency multiplicity matrix.
matrix_section = tex.split("The multiplicity matrix of common edges is", 1)[1].split(r"\end{pmatrix}", 1)[0]
rows = []
for row in re.findall(r"(?m)^([0-2](?:&[0-2]){7})(?:\\\\)?$", matrix_section):
    rows.append(list(map(int, row.split("&"))))
assert rows == data["adjacencyMultiplicity"], rows
print("PASS: data.json adjacency multiplicity matrix matches the published 8x8 matrix exactly.")

# Verify the stated geometric generator and face cycles appear in the source.
assert data["symmetry"]["map"] == "T(x,y,z) = (y,-x,-z)"
assert r"T(x,y,z)=(y,-x,-z)" in tex.replace(" ", "")
assert r"(F_1\ F_7\ F_2\ F_8)(F_3\ F_6\ F_4\ F_5)" in tex
print("PASS: C4 generator and the two published four-cycles are present and match the repository metadata.")

print("All available primary-source transcription checks passed.")
