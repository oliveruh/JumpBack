import { RESULTS_ELEMENTS as ELEMENTS } from "../core/elements";
import { DATA_PATHS } from "../core/constants";
import UTILS from "../core/utils";
import HtmlBuilder from "../core/html_builder";

const HTML = {
    magazineTriviaTitle: `
        <h3 class="sub-heading">Behind the Cover</h3>
    `,
    emptyMagazineTrivia: `
        <p class="text-muted">No extra trivia available at the moment.</p>
        <p>
            <a href="https://www.viz.com/shonenjump" target="_blank" rel="noopener noreferrer">
                Read the latest chapters on VIZ!
            </a>
        </p>
    `,
    renderMagazineTrivia: (trivia) => `
        <h4 class="font-bold">${trivia.wsj_trivia_title}</h4>
        <p>${trivia.wsj_trivia_content}</p>
    `

}

export const EXTRA_PANEL = {
  /**
   * The container element for the extra panel.
   * This is where the trivia information will be rendered.
   * @type {HTMLElement}
   */
  panelContainer: ELEMENTS.PANELS.EXTRA.container,

  /**
   * Renders the extra panel with trivia information.
   * This function fetches trivia data and updates the UI accordingly.
   */
  render: async function () {
    if (!PANEL.container) return;

    const extraPanelData = await UTILS.fetchData(DATA_PATHS.MAGAZINE_TRIVIA);

    const html = new HtmlBuilder();
    html.add(HTML.magazineTriviaTitle);

    if (!extraPanelData || extraPanelData.length === 0) {
      html.add(HTML.emptyMagazineTrivia);
    } else {
      const randomTrivia = extraPanelData[Math.floor(Math.random() * extraPanelData.length)];
      html.add(HTML.renderMagazineTrivia(randomTrivia));
    }

    this.panelContainer.innerHTML = html.build();
  }
};