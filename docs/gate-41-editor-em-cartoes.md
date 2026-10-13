# Gate 41 — Editor em cartões e cinza neutro (local, aguardando aprovação)

Referência: print do novo layout do usuário.
- **Cinza neutro na ferramenta** (`:root[data-view='app']`, fora da página inicial): fundo #121212, cartões #1c1c1c, bordas #2c2c2c; a página inicial mantém o próprio fundo. Estilo "Tecnológico" da peça passa de #06061a para #161616.
- **Editor em três cartões** (só dentro de `.stage`; o HTML exportado e a apresentação não mudam): painel esquerdo, coluna de detalhes (cartão + lista) e palco, cada um com borda fina e raio de 12px sobre o fundo da peça; sem a moldura externa e sem o logo interno.
- **Faixa do topo do palco** com "Apresentar" e "Como usar" e divisória; o fundo em volta dos cartões acompanha o fundo da peça.
- Menu direito, ícones novos e mobile (folha de edição) preservados. Testes: pres-edit, pres-select, layer-run, logout-run, lp-frame.

## Correção: gráficos passavam da altura do cartão
Em telas largas e médias a peça agora tem exatamente a altura da janela (`100vh − 65px`, altura real do cabeçalho); cada cartão rola por dentro (painel esquerdo, lista) e o gráfico se ajusta ao cartão do palco, sem esticar a página. Verificado nos 22 gráficos disponíveis, em 1800×1180, 1440×900 e 1200×760: nenhum passa do limite do cartão e a página não rola (o calendário tem só um elemento oculto de dica 3 px abaixo). Celular continua rolando como antes.
- **Faixa do topo do palco:** acima da linha ficam só "Apresentar" e "Como usar" (canto direito); todo gráfico começa abaixo dela (os de canvas começam 41 px abaixo do topo do cartão; os de tabela/indicadores ganham o mesmo recuo). Verificado nos 22 tipos em 2000×1055 e 1440×900: nenhum elemento visível acima da linha.
