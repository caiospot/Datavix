#!/usr/bin/env python3
"""Gera vendor/geo/brasil-uf.json: contornos simplificados dos 27 estados (fonte: malhas do IBGE, licença CC BY 4.0), em graus x100 (inteiros),
com sigla, nome, região e centróide. Rodar: curl das malhas e dos estados do IBGE para /tmp (ver README do script) e python3 scripts/make-brasil.py."""
import json, math, sys
G = json.load(open('/tmp/br-uf.json')); E = {str(e['id']): e for e in json.load(open('/tmp/br-est.json'))}
TOL = float(sys.argv[1]) if len(sys.argv) > 1 else 0.07
def dp(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy); best, bi = 0, 0
    for i in range(1, len(pts) - 1):
        p = pts[i]; d = abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / L if L else math.hypot(p[0] - a[0], p[1] - a[1])
        if d > best: best, bi = d, i
    if best > tol: return dp(pts[:bi + 1], tol)[:-1] + dp(pts[bi:], tol)
    return [a, b]
def area(r): return sum(r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1] for i in range(len(r))) / 2
out = {}
for f in G['features']:
    e = E[f['properties']['codarea']]; geo = f['geometry']; polys = geo['coordinates'] if geo['type'] == 'MultiPolygon' else [geo['coordinates']]
    rings = []
    for poly in polys:
        r = [(x, y) for x, y in poly[0]]
        if abs(area(r)) < 0.004: continue  # ilhas minúsculas
        s = dp(r, TOL); s = [(round(x * 100), round(y * 100)) for x, y in s]
        ded = [p for i, p in enumerate(s) if i == 0 or p != s[i - 1]]
        if len(ded) >= 4: rings.append(ded)
    big = max(rings, key=lambda r: abs(area(r))); A = area(big); cx = sum((big[i][0] + big[(i + 1) % len(big)][0]) * (big[i][0] * big[(i + 1) % len(big)][1] - big[(i + 1) % len(big)][0] * big[i][1]) for i in range(len(big))) / (6 * A); cy = sum((big[i][1] + big[(i + 1) % len(big)][1]) * (big[i][0] * big[(i + 1) % len(big)][1] - big[(i + 1) % len(big)][0] * big[i][1]) for i in range(len(big))) / (6 * A)
    out[e['sigla']] = { 'n': e['nome'], 'r': e['regiao']['nome'], 'c': [round(cx), round(cy)], 'p': [[c for p in r for c in p] for r in rings] }
json.dump(out, open('vendor/geo/brasil-uf.json', 'w'), separators=(',', ':'), ensure_ascii=False)
import os; print(len(out), os.path.getsize('vendor/geo/brasil-uf.json'), 'bytes')
