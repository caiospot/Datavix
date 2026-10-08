#!/usr/bin/env python3
"""Gera dados-teste/datavix-planilha-ideal.xlsx: uma planilha sintética (nada é dado real) pensada para acionar
todos os gráficos e recursos do Datavix. Abas:
  Vendas      planilha de valores (soma): todos os 17 gráficos, filtros, detalhes, avisos de qualidade, unificação de rótulos
  Casos CX    planilha de casos/pesquisa (conta linhas): taxas, impacto, onde varia, causas, termos, dados pessoais fora
  Funil       etapas em sequência com valor: fluxo (Sankey)
  Resumo      já somado por mês e região, com meta: dispersão e bolhas
  Leia-me     o que cada aba exercita
Rodar: python3 dados-teste/gerar-planilha-ideal.py (usa semente fixa; sempre gera o mesmo arquivo)."""
import random, math, datetime as dt, os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

R = random.Random(20261008)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'datavix-planilha-ideal.xlsx')

# ---------- geografia coerente: região > UF > lojas ----------
REG = {'Sudeste': ['SP', 'RJ', 'MG', 'ES'], 'Sul': ['PR', 'RS', 'SC'], 'Nordeste': ['BA', 'PE', 'CE'], 'Centro-Oeste': ['DF', 'GO'], 'Norte': ['AM', 'PA']}
UF_W = {'SP': 30, 'RJ': 14, 'MG': 11, 'ES': 3, 'PR': 7, 'RS': 6, 'SC': 6, 'BA': 6, 'PE': 4, 'CE': 3, 'DF': 4, 'GO': 4, 'AM': 1.5, 'PA': 1.5}
REG_OF = {u: r for r, us in REG.items() for u in us}
LOJA_NOME = {'SP': ['Paulista', 'Moema', 'Santo André'], 'RJ': ['Copacabana', 'Barra'], 'MG': ['Savassi', 'Uberlândia'], 'ES': ['Vitória'], 'PR': ['Curitiba Centro', 'Londrina'], 'RS': ['Porto Alegre', 'Caxias'],
             'SC': ['Florianópolis', 'Joinville'], 'BA': ['Salvador', 'Feira de Santana'], 'PE': ['Recife'], 'CE': ['Fortaleza'], 'DF': ['Brasília Asa Sul', 'Taguatinga'], 'GO': ['Goiânia', 'Anápolis'], 'AM': ['Manaus'], 'PA': ['Belém']}
LOJAS = [(f'Loja {n} ({u})', u) for u, ns in LOJA_NOME.items() for n in ns]  # 28 lojas
CANAIS = [('Loja física', 40), ('E-commerce', 28), ('Marketplace', 14), ('Televendas', 7), ('Parceiros', 7), ('Aplicativo', 4)]
CAT = {'Eletrônicos': (['Monitor 27"', 'Notebook Pro 14', 'Fone Bluetooth', 'Smartwatch', 'Teclado Mecânico', 'Webcam Full HD'], (350, 5200)),
       'Moda': (['Camiseta Básica', 'Jaqueta Jeans', 'Tênis Urbano', 'Vestido Midi'], (60, 520)),
       'Casa': (['Cafeteira Elétrica', 'Aspirador Robô', 'Jogo de Panelas', 'Luminária LED'], (90, 1800)),
       'Esporte': (['Bicicleta Aro 29', 'Esteira Dobrável', 'Halteres 10kg', 'Bola de Futsal'], (70, 3400)),
       'Beleza': (['Perfume 100ml', 'Kit Skincare', 'Secador Profissional'], (45, 780)),
       'Brinquedos': (['Bloco de Montar 500pç', 'Boneca Articulada', 'Carrinho Controle Remoto'], (40, 420))}
CAT_W = {'Eletrônicos': 34, 'Moda': 20, 'Casa': 18, 'Esporte': 12, 'Beleza': 9, 'Brinquedos': 7}
SEG = [('B2C', 62), ('B2B', 23), ('Governo', 7), ('Educação', 5), ('Sem segmento', 2), ('N/A', 1)]
PAG = [('Cartão de crédito', 46), ('Pix', 30), ('Boleto', 12), ('Cartão de débito', 8), ('Crédito na loja', 4)]
RESP = ['Ana Beatriz Souza', 'Bruno Lima Reis', 'Carla Dias Moreira', 'Daniel Pereira Alves', 'Eduarda Nunes', 'Felipe Araújo Costa', 'Gabriela Teixeira', 'Henrique Barros Silva']
NOMES = ['Marcos', 'Luciana', 'Rafael', 'Patrícia', 'Thiago', 'Juliana', 'André', 'Camila', 'Rodrigo', 'Fernanda', 'Gustavo', 'Larissa', 'Leandro', 'Beatriz', 'Vinícius', 'Aline', 'Caio', 'Renata']
SOBREN = ['Almeida', 'Santos', 'Oliveira', 'Ferreira', 'Ribeiro', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Azevedo', 'Barbosa', 'Cardoso', 'Freitas', 'Monteiro', 'Pinto', 'Vieira']
OBS = ['Cliente pediu revisão de preço após a negociação do trimestre; condição especial aprovada pela diretoria comercial.',
       'Entrega agendada para o período da manhã; o porteiro autorizou o recebimento e pediu confirmação por telefone antes da chegada.',
       'Pedido faz parte de uma compra corporativa maior, com faturamento parcelado em três vezes e nota fiscal única para o grupo.',
       'Cliente relatou atraso na transportadora e pediu acompanhamento diário até a entrega final no endereço informado.',
       'Troca de cor solicitada antes do envio; estoque confirmou disponibilidade e o prazo seguiu o combinado.']


def pick(pairs):
    tot = sum(w for _, w in pairs); x = R.random() * tot
    for v, w in pairs:
        x -= w
        if x <= 0:
            return v
    return pairs[-1][0]


def email(nome, sob):
    n = (nome + '.' + sob).lower().replace('ã', 'a').replace('é', 'e').replace('í', 'i').replace('ç', 'c').replace('â', 'a').replace('ó', 'o').replace('ú', 'u')
    return f'{n}{R.randint(1, 99)}@{R.choice(["exemplo.com", "mail.test", "correio.example"])}'


def pessoa():
    return f'{R.choice(NOMES)} {R.choice(SOBREN)}'


def style(ws, widths=None, money=(), pct=()):
    for c in ws[1]:
        c.font = Font(bold=True, color='0B0D0A'); c.fill = PatternFill('solid', fgColor='D4FF00'); c.alignment = Alignment(vertical='center')
    ws.freeze_panes = 'A2'
    for i, col in enumerate(ws.columns, 1):
        w = max(len(str(c.value)) if c.value is not None else 0 for c in list(col)[:80])
        ws.column_dimensions[get_column_letter(i)].width = min(46, max(11, w + 2))


wb = Workbook()

# =====================================================================================
# 1) Vendas: valores para somar. 3 anos, tendência, sazonalidade, 6 canais, 28 lojas, 22 produtos
# =====================================================================================
ws = wb.active; ws.title = 'Vendas'
H = ['Pedido', 'Data do pedido', 'Canal', 'Categoria', 'Região', 'UF', 'Produto', 'Loja', 'Segmento do cliente', 'Status do pedido', 'Forma de pagamento',
     'Quantidade', 'Receita (R$)', 'Custo (R$)', 'Margem (%)', 'Desconto (%)', 'Prazo de entrega (dias)', 'NPS do pedido', 'Cliente recorrente?', 'Entrega no prazo?',
     'Data de entrega', 'E-mail do cliente', 'Responsável comercial', 'Observação']
ws.append(H)
D0, D1 = dt.date(2023, 1, 2), dt.date(2025, 12, 30)
span = (D1 - D0).days
canal_variantes = {'Loja física': ['Loja física', 'Loja Física', 'loja fisica'], 'E-commerce': ['E-commerce', 'E-Commerce'], 'Parceiros': ['Parceiros', 'parceiros']}
N = 1600
for i in range(1, N + 1):
    # data: mais pedidos no fim do ano e crescimento ao longo dos anos
    while True:
        d = D0 + dt.timedelta(days=R.randint(0, span))
        t = (d - D0).days / span
        season = 1 + 0.55 * (d.month in (11, 12)) + 0.2 * (d.month in (5,)) - 0.15 * (d.month in (2, 3))
        if R.random() < min(1, (0.55 + 0.6 * t) * season / 1.9):
            break
    t = (d - D0).days / span
    # canal: e-commerce e aplicativo crescem; loja física encolhe
    pairs = [(c, w * (1 + (1.2 if c in ('E-commerce', 'Aplicativo', 'Marketplace') else -0.35 if c == 'Loja física' else 0) * t)) for c, w in CANAIS]
    canal = pick(pairs)
    cat = pick([(c, w * (1.3 if (d.month in (11, 12) and c in ('Brinquedos', 'Eletrônicos')) else 1)) for c, w in CAT_W.items()])
    prod_list, (pmin, pmax) = CAT[cat]
    prod = R.choice(prod_list)
    base_price = pmin + (pmax - pmin) * ((hash(prod) % 1000) / 1000.0 if False else (sum(map(ord, prod)) % 100) / 100.0) ** 1.4
    uf = pick(list(UF_W.items()))
    reg = REG_OF[uf]
    loja = R.choice([l for l, u in LOJAS if u == uf])
    qty = max(1, int(R.expovariate(1 / 2.2)) + 1) if cat != 'Eletrônicos' else R.choice([1, 1, 1, 2, 2, 3, 5])
    disc = max(0, min(35, round(R.gauss(8 if canal in ('Marketplace', 'Televendas') else 4, 4), 1)))
    receita = round(base_price * qty * (1 - disc / 100) * (1 + R.gauss(0, 0.04)), 2)
    mg_base = {'Eletrônicos': 0.14, 'Moda': 0.42, 'Casa': 0.28, 'Esporte': 0.24, 'Beleza': 0.5, 'Brinquedos': 0.33}[cat]
    margem = max(2.0, min(70.0, round((mg_base + R.gauss(0, 0.04) - disc / 250) * 100, 1)))
    custo = round(receita * (1 - margem / 100), 2)
    if i in (333, 777, 1201):  # pontos fora da curva de verdade
        receita = round(receita * R.choice([14, 18, 22]), 2); custo = round(receita * 0.78, 2); margem = 22.0
    prazo = max(1, int(R.gauss(4 + (3 if canal in ('Marketplace', 'Parceiros') else 0) + (4 if reg in ('Norte', 'Nordeste') else 0), 2)))
    nps = None if R.random() < 0.06 else max(0, min(10, int(round(R.gauss(8.2 - 0.18 * prazo - disc / 12 + (0.6 if canal == 'Loja física' else 0), 1.6)))))
    status = pick([('Entregue', 88), ('Em rota', 4), ('Cancelado', 5), ('Devolvido', 3)])
    recorrente = 'Sim' if R.random() < (0.31 + 0.18 * (canal == 'Aplicativo') + 0.1 * (canal == 'Loja física')) else 'Não'
    no_prazo = 'Sim' if R.random() < max(0.45, 0.97 - 0.045 * prazo) else 'Não'
    entrega = d + dt.timedelta(days=prazo) if status in ('Entregue', 'Devolvido') else None
    nome = R.choice(NOMES); sob = R.choice(SOBREN)
    cv = canal_variantes.get(canal)
    canal_txt = R.choice(cv) if (cv and R.random() < 0.035) else canal  # pequenas variações de escrita: aparecem como rótulos parecidos
    prod_txt = prod.lower() if R.random() < 0.01 else prod
    seg = pick(SEG)
    ws.append([f'PED-{i:05d}', d, canal_txt, cat, reg, uf, prod_txt, loja, seg, status, pick(PAG), qty, receita, custo, margem,
               None if R.random() < 0.04 else disc, prazo, nps, recorrente, no_prazo, entrega, email(nome, sob), R.choice(RESP), R.choice(OBS) if R.random() < 0.55 else None])
for row in ws.iter_rows(min_row=2, min_col=2, max_col=2):
    row[0].number_format = 'DD/MM/YYYY'
for row in ws.iter_rows(min_row=2, min_col=21, max_col=21):
    row[0].number_format = 'DD/MM/YYYY'
for col in (13, 14):
    for row in ws.iter_rows(min_row=2, min_col=col, max_col=col):
        row[0].number_format = '#,##0.00'
style(ws)

# =====================================================================================
# 2) Casos CX: cada linha é um caso; taxas, impacto, onde varia, causas, termos
# =====================================================================================
cx = wb.create_sheet('Casos CX')
HC = ['Protocolo', 'E-mail do cliente', 'Nome do cliente', 'Data da resposta', 'Jornada', 'Touchpoint', 'Canal de venda', 'Regional', 'Segmento do contrato',
      'Resolvido?', 'Cliente rechama após o encerramento?', 'Cliente fica satisfeito?', 'Cliente cancela?', 'Cliente aciona canais críticos?', 'Causa da não solução',
      'Esforço', 'NPS do cliente', 'Voz do cliente', 'Diagnóstico da análise']
cx.append(HC)
JORN = [('J1 - Jornada de uso - Suporte banda larga', 24, 0.34), ('J2 - Jornada de pagamento - Fatura e cobrança', 14, 0.5), ('J3 - Jornada de cancelamento - Retenção', 10, 0.68),
        ('J4 - Jornada de compra - Residencial', 18, 0.46), ('J5 - Jornada de mudança - Transferência de endereço', 9, 0.58), ('J6 - Jornada de TV - Pacotes e canais', 11, 0.52),
        ('J7 - Jornada de compra - Móvel', 8, 0.8), ('NPS relacional TV', 6, 0.5)]
TOUCH = ['DAC', 'Visita técnica', 'Aplicativo', 'Loja', 'Chat', 'Ouvidoria', 'Retenção', 'Contestar fatura', 'Agendamento', 'Pós-venda']
REGIONAL = ['SP Capital', 'SP Interior', 'Rio e Espírito Santo', 'Minas Gerais', 'Sul', 'Nordeste', 'Centro-Oeste e Norte']
SEGC = [('Black', 20), ('Purple', 38), ('Single', 17), ('Individual', 14), ('Sem segmento', 11)]
CAUSAS = [('Problema já havia sido resolvido', 24), ('Não realizou acompanhamento até conclusão', 21), ('Erro operacional', 18), ('Falta de alçada', 14), ('Regra de negócio', 11), ('Falha de sistema', 7), ('Cliente indisponível', 5)]
TEMAS = [('internet', ['A internet cai todos os dias à noite e o técnico não resolveu o sinal da casa', 'A internet está lenta mesmo com o plano mais caro e ninguém explica o motivo']),
         ('cobrança', ['Fui cobrado em duplicidade na fatura e já liguei três vezes sem solução', 'A cobrança veio com valor diferente do contrato e o atendimento não corrigiu']),
         ('técnico', ['O técnico marcou a visita e não apareceu, perdi o dia de trabalho', 'O técnico foi educado, mas o problema voltou dois dias depois']),
         ('atendimento', ['O atendimento demorou e precisei repetir o problema para cada atendente', 'Gostei do atendimento, resolveram rápido e me deram retorno por mensagem']),
         ('cancelamento', ['Tentei cancelar e transferiram minha ligação várias vezes sem resposta', 'Quero cancelar porque o serviço não entrega o que foi vendido']),
         ('instalação', ['A instalação ficou incompleta e os cabos estão expostos na parede', 'A instalação foi rápida e tudo funcionou no mesmo dia'])]
for i in range(1, 181):
    jn, _, rb = R.choices(JORN, weights=[w for _, w, _ in JORN])[0]
    d = dt.date(2025, 1, 6) + dt.timedelta(days=int(R.random() ** 0.8 * 620))
    ev = R.random()
    res_ok = R.random() < rb
    r_txt = None if R.random() < 0.18 else (R.choice(['SIM', 'SIM', 'Resolvido com sucesso']) if res_ok else R.choice(['NÃO', 'NÃO', 'Não resolvido']))
    ok = res_ok if r_txt else None
    rech = 'N/A' if r_txt is None and R.random() < 0.5 else ('SIM' if R.random() < (0.1 if ok else 0.43) else 'NÃO')
    sat = ('SIM' if R.random() < 0.9 else 'NÃO') if ok else (R.choice(['SIM', 'NÃO', 'NÃO', 'Cliente não quer opinar']) if R.random() < 0.7 else 'NÃO')
    canc = 'SIM' if R.random() < (0.05 if ok else 0.12) else 'NÃO'
    crit = R.choice(['SIM', 'SIM (OUVIDORIA)', 'SIM (ANATEL)']) if R.random() < (0.05 if ok else 0.16) else 'NÃO'
    causa = pick(CAUSAS) if (ok is False) else None
    esforco = R.choice([f'{R.randint(2, 40)} dias', f'{R.randint(2, 40)}', f'{R.randint(2, 40)} Dias'])
    nps = 0 if R.random() < 0.18 else max(0, min(10, int(round(R.gauss(7.5 if ok else 4.6, 2.4)))))
    tema, frases = R.choice(TEMAS)
    voz = R.choice(frases)
    diag = f'Cliente relatou {tema}; análise indica {"tratativa concluída pela equipe" if ok else "pendência sem responsável definido e retorno fora do prazo combinado"}, com recomendação de acompanhamento posterior.'
    nome = pessoa()
    cx.append([f'CX-{i:04d}', email(*nome.split()[:2]), nome, d, jn if R.random() > 0.04 else jn.upper(), R.choice(TOUCH), pick([(c, w) for c, w in CANAIS]), R.choice(REGIONAL), pick(SEGC),
               r_txt, rech, sat, canc, crit, causa, esforco, nps, voz, diag])
for row in cx.iter_rows(min_row=2, min_col=4, max_col=4):
    row[0].number_format = 'DD/MM/YYYY'
style(cx)

# =====================================================================================
# 3) Funil: etapas em sequência e valor (fluxo)
# =====================================================================================
fu = wb.create_sheet('Funil')
fu.append(['Lead', 'Origem do lead', 'Qualificação', 'Proposta', 'Resultado', 'Valor (R$)'])
ORI = [('Anúncios pagos', 30), ('Busca orgânica', 24), ('Indicação', 16), ('Eventos', 12), ('E-mail marketing', 10), ('Redes sociais', 8)]
for i in range(1, 451):
    o = pick(ORI)
    q = 'Qualificado' if R.random() < {'Indicação': 0.78, 'Eventos': 0.62, 'Busca orgânica': 0.55, 'Anúncios pagos': 0.4, 'E-mail marketing': 0.36, 'Redes sociais': 0.3}[o] else 'Descartado'
    pr = None; res = None
    if q == 'Qualificado':
        pr = 'Enviada' if R.random() < 0.82 else 'Sem proposta'
        if pr == 'Enviada':
            pr = R.choice(['Enviada', 'Enviada', 'Enviada', 'Negociação'])
            res = 'Ganho' if R.random() < (0.47 if pr == 'Negociação' else 0.34) else 'Perdido'
    fu.append([f'L{i:04d}', o, q, pr, res, round(R.lognormvariate(8.6, 0.7), 2)])
style(fu)

# =====================================================================================
# 4) Resumo: já somado por mês e região, com meta (dispersão e bolhas)
# =====================================================================================
rs = wb.create_sheet('Resumo')
rs.append(['Mês', 'Região', 'Receita realizada (R$)', 'Meta (R$)', 'Pedidos', 'Margem média (%)', 'Ticket médio (R$)'])
share = {'Sudeste': 0.52, 'Sul': 0.19, 'Nordeste': 0.14, 'Centro-Oeste': 0.1, 'Norte': 0.05}
for k in range(36):
    y, m = 2023 + k // 12, k % 12 + 1
    for reg, sh in share.items():
        meta = 3_000_000 * sh * (1 + 0.012 * k) * (1.25 if m in (11, 12) else 1)
        real = meta * R.uniform(0.82, 1.18) * (1 + (0.04 if reg == 'Sul' else -0.03 if reg == 'Norte' else 0))
        ped = int(real / R.uniform(310, 420))
        rs.append([dt.date(y, m, 1), reg, round(real, 2), round(meta, 2), ped, round(R.gauss(27, 3), 1), round(real / max(ped, 1), 2)])
for row in rs.iter_rows(min_row=2, min_col=1, max_col=1):
    row[0].number_format = 'MM/YYYY'
style(rs)

# =====================================================================================
# 5) Leia-me
# =====================================================================================
lm = wb.create_sheet('Leia-me')
lm.append(['Aba', 'O que exercita no Datavix', 'Como testar'])
for r in [
    ['Vendas', 'Planilha de valores (somar). Evolução no tempo, comparação, composição, dispersão e bolhas, calendário, leque, rios, cordilheira, raios, fluxo e árvore radial. Dados pessoais (e-mail e responsável) saem por padrão; identificador (Pedido) vira rótulo; Observação é texto de detalhe; 4% de vazios em Desconto e 6% em NPS; 3 pontos fora da curva em Receita; variações de escrita em Canal e Produto aparecem como rótulos parecidos; "Sem segmento" e "N/A" nunca lideram.', 'Escolha a aba Vendas. Em "O que é cada linha?" fica "Valores". Troque o gráfico no painel: todos os 17 aparecem.'],
    ['Casos CX', 'Planilha de casos (contar linhas). Taxa de resolução entre respostas válidas, impacto da resolução em "rechama" e "satisfeito", onde a taxa varia (jornada, touchpoint, segmento), causas mais frequentes, termos do texto livre, NPS, esforço escrito como "11 dias", dados pessoais fora, rótulos "SIM/Resolvido com sucesso/NÃO/Não resolvido" para classificar.', 'Escolha Casos CX. Em "Como li a sua planilha" confira o tipo "Casos ou respostas" e como cada resposta sim/não foi contada. Use "Guiar em 3 perguntas".'],
    ['Funil', 'Etapas em sequência (origem, qualificação, proposta, resultado) com valor: fluxo (Sankey) e conversão.', 'Escolha Funil e o gráfico Funil de fluxo.'],
    ['Resumo', 'Planilha já somada (mês × região) com meta: dispersão realizado × meta, bolhas com tamanho em pedidos, evolução e participação por região.', 'Escolha Resumo. Cada linha já é um total (mês × região); se quiser, marque "Resumo já somado" em "O que é cada linha?".'],
]:
    lm.append(r)
style(lm); lm.column_dimensions['B'].width = 90; lm.column_dimensions['C'].width = 60
for row in lm.iter_rows(min_row=2):
    for c in row:
        c.alignment = Alignment(wrap_text=True, vertical='top')

wb.save(OUT)
print('ok', OUT, {s.title: s.max_row - 1 for s in wb.worksheets})
