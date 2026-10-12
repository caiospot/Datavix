# Gate 41 — Editor em cartões e cinza neutro (local, aguardando aprovação)

Referência: print do novo layout do usuário.
- **Cinza neutro na ferramenta** (`:root[data-view='app']`, fora da página inicial): fundo #121212, cartões #1c1c1c, bordas #2c2c2c; a página inicial mantém o próprio fundo. Estilo "Tecnológico" da peça passa de #06061a para #161616.
- **Editor em três cartões** (só dentro de `.stage`; o HTML exportado e a apresentação não mudam): painel esquerdo, coluna de detalhes (cartão + lista) e palco, cada um com borda fina e raio de 12px sobre o fundo da peça; sem a moldura externa e sem o logo interno.
- **Faixa do topo do palco** com "Apresentar" e "Como usar" e divisória; o fundo em volta dos cartões acompanha o fundo da peça.
- Menu direito, ícones novos e mobile (folha de edição) preservados. Testes: pres-edit, pres-select, layer-run, logout-run, lp-frame.
