import HtmlBuilder from "../../core/html_builder";

export const EXTRA_PANEL = ({ elements, state, htmlTemplates, errorHandler }) => {
    const { container } = elements.panels.extra;
    const { magazineTriviaTitle, emptyMagazineTrivia, renderMagazineTrivia } = htmlTemplates;

    /**
     * Renders the extra panel with trivia information.
     * This function fetches trivia data and updates the UI accordingly.
     */
    const render = async () => {
        if (!container) return;

        try {
            const allMagazineTrivia = await state.fetchData(state.dataPaths.MAGAZINE_TRIVIA);

            const html = new HtmlBuilder();
            html.add(magazineTriviaTitle);

            if (!allMagazineTrivia || allMagazineTrivia.length === 0) {
                html.add(emptyMagazineTrivia);
            } else {
                const randomTrivia = allMagazineTrivia[Math.floor(Math.random() * allMagazineTrivia.length)];
                html.add(renderMagazineTrivia(randomTrivia));
            }

            container.innerHTML = html.build();
        } catch (error) {
            errorHandler.handleError(error);
        }
    };

    return { render };
}