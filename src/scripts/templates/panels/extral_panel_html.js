export const EXTRA_PANEL_HTML = {
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