from __future__ import annotations

import json
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
VERTICES = {int(k): tuple(map(Fraction, v)) for k, v in DATA["vertices"].items()}
FACES = DATA["faces"]


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def mul(a, scalar):
    return tuple(x * scalar for x in a)


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def sign(value):
    return (value > 0) - (value < 0)


def normal(face):
    plane = face["plane"]
    return (Fraction(plane["a"]), Fraction(plane["b"]), Fraction(plane["c"]))


def plane_eval(plane, point):
    return (
        Fraction(plane["a"]) * point[0]
        + Fraction(plane["b"]) * point[1]
        + Fraction(plane["c"]) * point[2]
        - Fraction(plane["d"])
    )


def dominant_drop(face_normal):
    magnitudes = [abs(value) for value in face_normal]
    return magnitudes.index(max(magnitudes))


def project2(point, drop):
    if drop == 0:
        return (point[1], point[2])
    if drop == 1:
        return (point[0], point[2])
    return (point[0], point[1])


def orient(a, b, c):
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def on_segment(a, b, point):
    return (
        orient(a, b, point) == 0
        and min(a[0], b[0]) <= point[0] <= max(a[0], b[0])
        and min(a[1], b[1]) <= point[1] <= max(a[1], b[1])
    )


def segments_intersect(a, b, c, d):
    o1, o2, o3, o4 = orient(a, b, c), orient(a, b, d), orient(c, d, a), orient(c, d, b)
    if o1 == 0 and on_segment(a, b, c):
        return True
    if o2 == 0 and on_segment(a, b, d):
        return True
    if o3 == 0 and on_segment(c, d, a):
        return True
    if o4 == 0 and on_segment(c, d, b):
        return True
    return sign(o1) * sign(o2) < 0 and sign(o3) * sign(o4) < 0


def point_in_polygon(poly3, face_normal, point3):
    drop = dominant_drop(face_normal)
    polygon = [project2(point, drop) for point in poly3]
    point = project2(point3, drop)
    count = len(polygon)

    for i in range(count):
        if on_segment(polygon[i], polygon[(i + 1) % count], point):
            return True

    inside = False
    x, y = point
    for i in range(count):
        x1, y1 = polygon[i]
        x2, y2 = polygon[(i + 1) % count]
        if (y1 > y) != (y2 > y):
            crossing_x = x1 + (y - y1) * (x2 - x1) / (y2 - y1)
            if crossing_x > x:
                inside = not inside
    return inside


def assert_simple(face):
    polygon3 = [VERTICES[vertex_id] for vertex_id in face["walk"]]
    face_normal = normal(face)
    drop = dominant_drop(face_normal)
    polygon = [project2(point, drop) for point in polygon3]
    count = len(polygon)

    twice_area = sum(
        polygon[i][0] * polygon[(i + 1) % count][1]
        - polygon[(i + 1) % count][0] * polygon[i][1]
        for i in range(count)
    )
    assert twice_area != 0, f'{face["id"]}: projected polygon area is zero'

    for i in range(count):
        a, b = polygon[i], polygon[(i + 1) % count]
        for j in range(i + 1, count):
            if j == i or (j + 1) % count == i or (i + 1) % count == j:
                continue
            c, d = polygon[j], polygon[(j + 1) % count]
            assert not segments_intersect(
                a, b, c, d
            ), f'{face["id"]}: non-adjacent boundary edges intersect'


def line_boundary_candidates(face, other_plane, direction):
    points = [VERTICES[vertex_id] for vertex_id in face["walk"]]
    values = [plane_eval(other_plane, point) for point in points]
    output = {}
    count = len(points)

    for i in range(count):
        p, q = points[i], points[(i + 1) % count]
        sp, sq = values[i], values[(i + 1) % count]

        if sp == 0:
            output[dot(direction, p)] = p

        if sp == 0 and sq == 0:
            output[dot(direction, q)] = q
        elif sp * sq < 0:
            lam = sp / (sp - sq)
            point = add(p, mul(sub(q, p), lam))
            output[dot(direction, point)] = point
        elif sq == 0:
            output[dot(direction, q)] = q

    return output


def actual_intersection(face_a, face_b):
    normal_a = normal(face_a)
    normal_b = normal(face_b)
    direction = cross(normal_a, normal_b)
    assert direction != (0, 0, 0), f'{face_a["id"]}/{face_b["id"]}: supporting planes are parallel'

    candidates = {}
    candidates.update(line_boundary_candidates(face_a, face_b["plane"], direction))
    candidates.update(line_boundary_candidates(face_b, face_a["plane"], direction))
    parameters = sorted(candidates)

    polygon_a = [VERTICES[vertex_id] for vertex_id in face_a["walk"]]
    polygon_b = [VERTICES[vertex_id] for vertex_id in face_b["walk"]]

    intervals = []
    points = set()

    for parameter, point in candidates.items():
        if point_in_polygon(polygon_a, normal_a, point) and point_in_polygon(polygon_b, normal_b, point):
            points.add(parameter)

    for left, right in zip(parameters, parameters[1:]):
        if left == right:
            continue
        midpoint = mul(add(candidates[left], candidates[right]), Fraction(1, 2))
        if point_in_polygon(polygon_a, normal_a, midpoint) and point_in_polygon(
            polygon_b, normal_b, midpoint
        ):
            intervals.append((left, right))

    return direction, intervals, points


def edge_dictionary(face):
    walk = face["walk"]
    output = {}
    for i in range(len(walk)):
        a, b = walk[i], walk[(i + 1) % len(walk)]
        output[tuple(sorted((a, b)))] = (a, b)
    return output


def shared_edges(face_a, face_b):
    edges_a = edge_dictionary(face_a)
    edges_b = edge_dictionary(face_b)
    return [edges_a[key] for key in edges_a.keys() & edges_b.keys()]


def merge_intervals(intervals):
    if not intervals:
        return []

    ordered = sorted((min(a, b), max(a, b)) for a, b in intervals)
    merged = [ordered[0]]

    for left, right in ordered[1:]:
        previous_left, previous_right = merged[-1]
        if left <= previous_right:
            merged[-1] = (previous_left, max(previous_right, right))
        else:
            merged.append((left, right))

    return merged


for face in FACES:
    assert_simple(face)

pair_reports = []
for i in range(len(FACES)):
    for j in range(i + 1, len(FACES)):
        face_a, face_b = FACES[i], FACES[j]
        direction, actual_intervals, actual_points = actual_intersection(face_a, face_b)
        expected_edges = shared_edges(face_a, face_b)

        assert expected_edges, f'{face_a["id"]}/{face_b["id"]}: expected at least one shared edge'

        expected_intervals = [
            (dot(direction, VERTICES[a]), dot(direction, VERTICES[b]))
            for a, b in expected_edges
        ]

        actual_merged = merge_intervals(actual_intervals)
        expected_merged = merge_intervals(expected_intervals)

        assert (
            actual_merged == expected_merged
        ), f'{face_a["id"]}/{face_b["id"]}: actual intersection differs from prescribed shared edges'

        for parameter in actual_points:
            assert any(
                left <= parameter <= right for left, right in expected_merged
            ), f'{face_a["id"]}/{face_b["id"]}: unintended isolated intersection point'

        pair_reports.append((face_a["id"], face_b["id"], len(expected_edges)))

single_pairs = sum(1 for report in pair_reports if report[2] == 1)
double_pairs = sum(1 for report in pair_reports if report[2] == 2)

assert single_pairs == 20
assert double_pairs == 8

print("PASS: 8/8 faces are nondegenerate simple polygons (exact Fraction arithmetic).")
print("PASS: 28/28 face pairs intersect exactly in their prescribed shared edge set.")
print("PASS: no unintended crossing interval or isolated face-face contact was found.")
print("PASS: pair multiplicities are 20 single-edge + 8 double-edge.")
