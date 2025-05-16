

export const EXTRA_PANEL = ({ elements, state, htmlTemplates, errorHandler }) => {
    const { container } = elements.panels.extra;
    const { magazineTriviaTitle, emptyMagazineTrivia, renderMagazineTrivia } = htmlTemplates;
    
    const render = async () => {
        if (!container) return;
    
        try {
        const extraPanelData = await state.fetchData(state.dataPaths.MAGAZINE_TRIVIA);
    
        const html = new htmlTemplates.HtmlBuilder();
        html.add(magazineTriviaTitle);
    
        if (!extraPanelData || extraPanelData.length === 0) {
            html.add(emptyMagazineTrivia);
        } else {
            const randomTrivia = extraPanelData[Math.floor(Math.random() * extraPanelData.length)];
            html.add(renderMagazineTrivia(randomTrivia));
        }
    
        container.innerHTML = html.build();
        } catch (error) {
        errorHandler.handleError(error);
        }
    };
    
    return { render };
}