import { RESULTS_ELEMENTS as ELEMENTS } from "../core/elements";
import { RESULTS_STATE as STATE } from "../core/state";
import HtmlBuilder from "../core/html_builder";
import {
    ERRORS
} from "../core/constants";
import ERROR_HANDLER from "../handlers/error_handler";

/**
 * HTML templates for rendering the table of contents and related messages.
 */
const HTML = {
    messageNoIssueData: `
        <p class="placeholder-text">
            Sorry, no information found for this date. Jump might not have been published, or our records are incomplete.
        </p>
    `,
    placeholderNoIssueData: `
        N/A
    `,
    messageTocEmpty: `
        <p class="text-muted">
            Contents for this issue are not available.
        </p>
    `,
    tocTitle: `
        <h2 class="tab-section-title">
            Table of Contents (TOC)
        </h2>
    `,
    tocItem: (title) => `
        <li>
            <span class="list-icon">
                <i class="fas fa-book-open"></i>
            </span>
            ${title}
        </li>
    `
};

export const TABLE_OF_CONTENTS_TAB = {
    /**
     * The container element for the table of contents.
     * This is where the TOC will be rendered.
     * @type {HTMLElement}
     */
    tabContainer: ELEMENTS.TABS.TOC,

    /**
     * Main rendering function for the issue data.
     * It updates the UI based on the provided issue data or shows a 'no data' message.
     * @async
     * @param {object | null} issueData - The data for the issue to render.
     * Expected to be null if no data is found.
     */
    render: async function (issueData = STATE.ISSUE_DATA) {
        if (!issueData) {
            this._renderNoDataForIssue();
            return;
        }

        try {
            this._renderTocForIssue(issueData);
        } catch (error) {
            ERROR_HANDLER.report(
                STATE.context,
                ERRORS.TABLE_OF_CONTENTS_ERROR.code,
                error.message,
                { date: STATE.birthDateFromURL }
            );
        }
    },

    /**
     * Renders a "no data" state in the UI when issue information is not available.
     * @private
     */
    _renderNoDataForIssue: function () {
        if (this.tabContainer) this.tabContainer.innerHTML = HTML.messageNoIssueData;

        ERROR_HANDLER.report(
            STATE.context,
            ERRORS.NO_ISSUE_FOUND.code,
            ERRORS.NO_ISSUE_FOUND.message,
            { date: STATE.birthDateFromURL }
        );
    },

    /**
     * Renders the table of contents for a specific issue.
     * It updates the UI with the issue number and the table of contents.
     * @private
     * @param {object} issue - The issue containing the table of contents.
     */
    _renderTocForIssue: function (issue) {
        if (!this.tabContainer) throw new Error('ELEMENT NOT FOUND');

        const html = new HtmlBuilder();
        html.add(HTML.tocTitle);

        if (issue.table_of_contents?.length > 0) {
            html.add(this._renderChapterList(issue.table_of_contents));
        } else {
            html.add(HTML.messageTocEmpty);
        }

        this.tabContainer.innerHTML = html.build();
    },

    /**
     * Renders a list of chapters in the table of contents.
     * @private
     * @param {Array} chapters - An array of chapter objects.
     * Each object should have a 'title' property.
     * @returns {string} - The HTML string for the list of chapters.
     */
    _renderChapterList: function (chapters) {
        const html = new HtmlBuilder();

        html.add('<ul class="content-list">');
        for (const chapter of chapters) {
            html.add(HTML.tocItem(chapter.title));
        }
        html.add('</ul>');

        return html.build();
    }
};
