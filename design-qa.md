# JumpBack — QA visual

## Revisão atual — 27 de outubro de 2026

O polimento atual e suas evidências estão em [Polimento de index e results](docs/visual-polish-2026-10-27.md). Foram aprovados 12 testes unitários, 49 cenários de navegador, o catálogo de 2.600 edições e 32 combinações de página/idioma/viewport.

O resultado agora usa rolagem vertical normal: capa e sumário compõem a abertura, seguidos do horóscopo aberto. As medidas e afirmações de encaixe em uma única tela abaixo pertencem às revisões anteriores e não descrevem a composição atual.

## Histórico — QA da proposta 3

Data: 26 de outubro de 2026. Revisão 2 do resultado: 27 de outubro de 2026.

## Referência e comparação

- Fonte visual: [proposta 3 selecionada](docs/images/event-proposal-selected.png),
  prancha de 1024 × 1536px com entrada e resultado.
- Implementação: [entrada PT-BR](test-artifacts/event/final/pt-home-1920.png) e
  [resultado PT-BR](test-artifacts/event/final/pt-results-1920.png), ambos capturados
  em Chromium a 1920 × 1080 CSS px, `deviceScaleFactor: 1`.
- Estado: data escolhida `1997-06-09`, valor de entrada PT-BR `09/06/1997`, edição
  do acervo #1450, índice completo com as 19 entradas do acervo visíveis.
- Personagens nas capturas: par One Piece selecionado pelo teste dentre os dados
  existentes. A aplicação continua sorteando os dez pares disponíveis.
- Evidência conjunta: [prancha de comparação](test-artifacts/event/comparison.png),
  2240 × 1650px. Fonte e capturas foram colocadas no mesmo documento de comparação
  e inspecionadas juntas; as imagens internas não foram retocadas.

A fonte é uma prancha conceitual com dois enquadramentos ilustrativos, não uma
especificação de dois viewports Full HD em escala 1:1. A comparação normaliza a
largura da folha: fonte a 1024px; capturas a 1162px, de modo que os 1600px da folha
implementada fiquem próximos dos 968px de folha na referência. A implementação
usa a área real de um monitor horizontal; a forma e a hierarquia são comparadas
após essa normalização, sem alegar equivalência pixel a pixel da prancha inteira.

## Histórico de revisão

1. **P2 — resultado padrão excessivamente alto.**
   A captura inicial tinha 1207px de documento em PT e 1228px em EN no viewport
   de 1080px de altura. Os espaços entre metadados, conteúdo e ações alongavam a
   folha além da composição desejada. Evidência: `test-artifacts/event/initial/`.
   Correção: reduzir intervalos e selo, preservar o texto do sumário, reunir o
   aviso do link com as ações e colocar a barra dentro da coluna de informações.
   Evidência posterior: `test-artifacts/event/refined/` e `final/`; ambos os
   documentos padrão agora medem 1080px, com ações inteiramente visíveis.

2. **P2 — transformação herdada no campo e no botão.**
   A regra legada inclinava controles que deveriam permanecer estáveis na nova
   ficha. Correção: remover o skew nesses controles, preservar somente o
   deslocamento curto de hover/pressão e manter foco independente do hover.
   Evidência posterior: recorte de foco e medidas retangulares em `final/`.

3. **P2 — formulário com pouca escala diante do título.**
   A primeira comparação conjunta mostrava a entrada menor que a ênfase da
   proposta. Correção: formulário de até 700px, valor digitado de até 40px,
   botão de até 620px e título de até 96px no monitor de referência.
   Evidência posterior: comparação final e recorte do formulário de 700 × 316px.

4. **Revisão 2 — resultado por rolagem, não por abas.**
   As cinco abas escondiam o sumário e exigiam dois toques para ler a edição.
   Correção: o índice passa a ser um sumário impresso sempre visível — 19 entradas
   em duas colunas a partir de 721px e em uma coluna no celular, com condutores
   pontilhados e número de capítulo alinhado à direita. As estatísticas e as
   curiosidades saem; "Seu signo" e "Joia escondida" viram dois cartões de convite
   ao lado da capa, com faixa na cor do signo e faixa hachurada na joia. "Sobre a
   data desta edição" vira um tooltip discreto sob a data fina, e o espaço que
   ocupava recebe a nota da redação: uma trivia do arquivo de curiosidades
   (`src/br/data/wsj_trivia.json`), trocada a cada carregamento pela sacola de
   sessão, com contador "n/total" e botão "Outra nota". A barra de ações deixa de
   ser fixa no celular e passa a ficar no fluxo, depois dos convites. Tokens do
   resultado foram isolados em `--rp-*` com elevação nomeada (`--lift-*`), sem
   alterar a paleta, as fontes ou os assets da identidade.

## Superfícies de fidelidade

| Superfície | Avaliação final |
| --- | --- |
| Fontes e tipografia | Bangers/Rubik locais preservadas. Título alinhado à esquerda com contorno e sombra de tinta. Em Full HD: título 96px, entrada 40px, datas do resultado 26px e índice 16px com capítulo 13px. Texto útil refluindo sem cortes. |
| Espaçamento e composição | Cabeçalho e folha de até 1600px comuns às duas páginas. Formulário amarelo à esquerda, personagens em dois quadros à direita. Resultado com capa integral à esquerda e coluna de ficha à direita: identificação, nota da redação, convites, ações. Índice em faixa própria, abaixo do quadro. |
| Cores e tokens | Papel, tinta, laranja e amarelo existentes mantidos. Datas destacadas em amarelo, faixa de signo na cor do signo, faixa hachurada na joia, foco azul contrastante. O resultado usa tokens `--rp-*` e elevação nomeada; nenhuma cor nova fora da paleta. |
| Imagens e assets | Logo, colagem, personagens e capas originais preservados. Capa real desta edição: 451 × 650px; proporção mantida. Apenas o pequeno acento decorativo de tinta foi gerado como PNG com alpha. |
| Texto e conteúdo | Instruções da entrada encurtadas, dica de Enter explícita e rótulo PT-BR "Joia escondida". Datas por extenso e semântica de data de capa/número no acervo preservadas. Seis notas da redação em PT-BR e EN, com contagem de votos vinda do acervo. Registros históricos e correspondência não alterados. |

Recortes inspecionados: [campo e foco](test-artifacts/event/final/pt-input-focus.png),
700 × 316px, e [datas e metadados](test-artifacts/event/final/pt-date-detail.png),
840 × 345px. O recorte do formulário coincide com seu limite geométrico; a
visibilidade do foco também foi conferida na página completa e por interação.

Diferenças intencionais em relação à imagem gerada: os assets reais substituem
as reinterpretações do mock; os diálogos aleatórios existentes são preservados;
os números do campo usam Rubik para leitura; o ícone ilustrativo de calendário
não foi reproduzido como um botão sem ação. A ordem de entrada é explícita no
campo já implementado, sem depender do locale do navegador.

## Validação funcional e de viewport

- `npm test`: aprovado.
- `npm run catalog:check`: 2600 edições e 54 arquivos anuais verificados.
- `npm run test:smoke`: 48 cenários aprovados na versão final, sem exceções de
  página ou overflow horizontal. Incluem busca, validação, erros, retry de capa,
  índice completo, convites de signo e joia, nota da redação, tooltip da data,
  idioma, retorno, compartilhamento e fallbacks.
- 28 combinações adicionais de página/idioma/viewport, com capas reais, aprovadas:
  320×844, 390×844, 768×1024, 1024×900, 1366×768, 1536×864 e 1920×1080.
- Oito combinações adicionais com áreas úteis equivalentes a zoom de 125% e
  200%: 1536×864 com densidade 1.25 e 960×540 com densidade 2. São simulações da
  área CSS/densidade, não testes em um monitor físico ou na UI de zoom do navegador.
- Auditoria determinística de folha (`ux_audit`) em `src/css/results.css`:
  contraste APCA aprovado (mínimo Lc 80,65 em texto pequeno), tokens sem hex cru
  fora de `:root`, estados `:focus-visible` e `:disabled` presentes e nenhum
  padrão de slop. A concatenação com as folhas legadas ainda acusa a dívida
  antiga de `style.css` e `reveal.css` (hex crus e sombras `rgba()`), fora do
  escopo desta revisão.
- Em Full HD, entrada e resultado padrão cabem no viewport nos dois idiomas.
  Viewports menores, zoom e índices extensos de 40+ entradas usam rolagem
  vertical normal, mantendo todos os dados e controles acessíveis.
- A barra de ações acompanha o fluxo do documento em todos os tamanhos; não há
  mais elemento fixo cobrindo conteúdo no celular.

Medidas: `test-artifacts/event/final/measurements.json`,
`matrix-final/measurements.json` e `zoom/measurements.json`.

## Limites e ajustes opcionais

Sem achados P0/P1/P2 pendentes nesta implementação. Ajuste P3 opcional: curadoria
dos diálogos de todos os personagens para versões mais curtas no contexto do
evento. Os textos existentes permanecem legíveis e completos.

A resolução física e a iluminação do equipamento ainda não foram informadas.
O ensaio presencial de leitura e uso continua sendo uma etapa de montagem.
Validação executada em Chromium; não representa teste em Safari/Firefox nem
certificação completa de acessibilidade. Nenhuma publicação foi realizada.

## Checklist

- [x] Fonte selecionada resolvida sem ambiguidade.
- [x] Referência e capturas finais comparadas juntas, com recortes legíveis.
- [x] Questões P2 encontradas corrigidas e recapturadas.
- [x] PT-BR e EN, datas, teclado, convites, nota da redação e compartilhamento preservados.
- [x] Viewports e simulações de zoom sem overflow horizontal.
- [x] Prévia local mantida em `http://127.0.0.1:4173/`.

final result: passed
