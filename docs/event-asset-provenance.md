# Acento de tinta da proposta 3

Asset de produção: `src/assets/images/ink-burst.png`, PNG RGBA de 1086 × 1448px,
com transparência real. Consumido como decoração no CSS do título e botão da
entrada, com `pointer-events: none`. Logo, personagens, fundo e capas existentes
foram reutilizados, sem regeneração.

Produção: ferramenta integrada `image_gen__imagegen`, com
`transparent_background: true`. Referência visual: a proposta 3 selecionada,
preservada em `docs/images/event-proposal-selected.png`.

Prompt final utilizado:

```text
Create ONE isolated decorative ink emphasis burst as a transparent PNG asset for this existing manga UI. The reference is visual style and placement only: extract the idea of the three near-black wedge-shaped ink marks to the LEFT of the large heading and primary button. Output ONLY those three bold near-black #25231F solid tapered brush strokes arranged vertically in a short fan, pointing right toward an imaginary headline. Top stroke slopes down-right, middle stroke points right, bottom stroke slopes up-right. Exactly three clean angular wedges with tiny hand-ink character, no texture outside their edges. Three strokes together form a compact vertically oriented accent approximately 3:4 width-to-height. Tightly frame the artwork, with only 5 percent transparent padding. Genuinely transparent background, preserved alpha. No text, letters, numbers, logo, interface, panels, characters, arrows, gradients, shadows, white box or other art. Intended rendering size roughly44×60px, so each stroke must be bold and distinct at tiny display sizes. Generate a crisp high-resolution raster asset, not a screenshot or SVG.
```
