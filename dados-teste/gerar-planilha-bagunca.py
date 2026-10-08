#!/usr/bin/env python3
"""Gera dados-teste/datavix-planilha-bagunca.xlsx: planilhas "do mundo real" que o Datavix arruma na leitura (sem mudar valores).
Abas: Título e totais | Largo por mês | Largo por ano | Mês sem ano | Largo com meta | Com total fora."""
import os, random, datetime as dt
from openpyxl import Workbook
R = random.Random(7)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'datavix-planilha-bagunca.xlsx')
wb = Workbook()

# 1) título acima do cabeçalho, subtotais por região, total geral e rodapé
ws = wb.active; ws.title = 'Título e totais'
ws.append(['Relatório de vendas por região e produto - 2025'])
ws.append([])
ws.append(['Fonte: ERP interno (extração de 08/10)'])
ws.append(['Região', 'Produto', 'Quantidade', 'Receita (R$)', 'Margem (%)'])
grand = [0, 0]
for reg, prods in {'Sudeste': ['Notebook', 'Monitor', 'Teclado'], 'Sul': ['Notebook', 'Monitor'], 'Nordeste': ['Notebook', 'Teclado', 'Webcam']}.items():
    sq = sr = 0
    for p in prods:
        q = R.randint(20, 90); r = round(q * R.uniform(120, 4200), 2)
        ws.append([reg, p, q, r, round(R.uniform(12, 40), 1)]); sq += q; sr += r
    ws.append([f'Subtotal {reg}', None, sq, round(sr, 2), None]); grand[0] += sq; grand[1] += sr
ws.append(['Total geral', None, grand[0], round(grand[1], 2), None])
ws.append([])
ws.append(['Gerado em 08/10/2026 por sistema'])

# 2) largo por mês, com coluna Total e linha Total
w2 = wb.create_sheet('Largo por mês')
meses = [f'{m}/25' for m in ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']]
w2.append(['Produto', 'Região'] + meses + ['Total'])
tot = [0] * 12
for p in ['Notebook', 'Monitor', 'Teclado', 'Webcam', 'Headset']:
    for reg in ['Sudeste', 'Sul', 'Nordeste']:
        v = [round(R.uniform(8000, 90000) * (1 + i * 0.03), 2) for i in range(12)]
        w2.append([p, reg] + v + [round(sum(v), 2)]); tot = [a + b for a, b in zip(tot, v)]
w2.append(['Total', None] + [round(x, 2) for x in tot] + [round(sum(tot), 2)])

# 3) largo por ano (cabeçalho numérico)
w3 = wb.create_sheet('Largo por ano')
w3.append(['Unidade', 'Região', 2022, 2023, 2024, 2025])
for u in ['Centro', 'Norte', 'Sul', 'Leste', 'Oeste', 'Aeroporto']:
    w3.append([u, R.choice(['A', 'B']), *[round(R.uniform(1e6, 9e6)) for _ in range(4)]])

# 4) meses sem ano (rótulos categóricos)
w4 = wb.create_sheet('Mês sem ano')
w4.append(['Produto'] + ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'])
for p in ['Café', 'Chá', 'Suco', 'Água']:
    w4.append([p] + [R.randint(100, 900) for _ in range(6)])

# 5) largo mas com outra coluna numérica (meta): o app NÃO desdobra e avisa
w5 = wb.create_sheet('Largo com meta')
w5.append(['Produto', 'Meta anual', 'Jan/25', 'Fev/25', 'Mar/25'])
for p in ['A', 'B', 'C', 'D']:
    w5.append([p, 100000, R.randint(5000, 20000), R.randint(5000, 20000), R.randint(5000, 20000)])

# 6) total sem a palavra Total exata: subtotal verificado por soma
w6 = wb.create_sheet('Subtotal verificado')
w6.append(['Departamento', 'Centro de custo', 'Orçado (R$)', 'Realizado (R$)'])
for d, n in [('Comercial', 3), ('Operações', 4)]:
    so = sr = 0
    for k in range(n):
        o = round(R.uniform(50000, 90000), 2); r = round(o * R.uniform(0.8, 1.2), 2); w6.append([d, f'CC-{d[:3].upper()}{k + 1}', o, r]); so += o; sr += r
    w6.append([f'Subtotal {d}', None, round(so, 2), round(sr, 2)])
wb.save(OUT); print('ok', OUT)
