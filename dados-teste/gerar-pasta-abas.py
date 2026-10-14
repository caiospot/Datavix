# Pastas de trabalho de teste do portão 51: aba hidden, aba vazia, aba de notas e duas abas de dados sem relação; e uma pasta só com abas vazias.
import openpyxl
wb = openpyxl.Workbook(); ws = wb.active; ws.title = 'Vendas'
ws.append(['Mês', 'Loja', 'Receita', 'Unidades'])
for m in range(1, 13):
    for loja in ['Centro', 'Norte', 'Sul']:
        ws.append([f'2025-{m:02d}-01', loja, 1000 + m * 37 + len(loja) * 11, 20 + m])
h = wb.create_sheet('Rascunho'); h.append(['x', 'y']); h.append([1, 2]); h.sheet_state = 'hidden'
wb.create_sheet('Vazia')
n = wb.create_sheet('Notas'); n.append(['Item', 'Texto']); n.append(['Origem', 'Exportação do sistema de vendas, em reais.']); n.append(['Atenção', 'Valores em R$ sem ajuste de inflação.'])
wb.save('pasta-abas.xlsx')
wb = openpyxl.Workbook(); wb.active.title = 'A'; wb.create_sheet('B'); wb.save('pasta-vazia.xlsx')
