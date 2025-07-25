import { RESULTS_ELEMENTS as ELEMENTS } from "../core/elements";
import { RESULTS_STATE as STATE } from "../core/state";
import { CONFIG } from "../core/config";
import UTILS from "../core/utils";
import HtmlBuilder from "../core/html_builder";
import ANALYTICS from "../services/analytics_service";
import {
    ERRORS,
    PAGE_IDS,
    PLACEHOLDERS
} from "../core/constants";
import ERROR_HANDLER from "../handlers/error_handler";
import { formatDateDisplay } from "../core/date_helper";

const CONTEXT = PAGE_IDS.RESULTS_PAGE;

const HTML = {
    messageNoData: `
        <p class="placeholder-text">
            Sorry, no information found for this date. Jump might not have been published, or our records are incomplete.
        </p>
    `,
    tocTitle: `
        <h2 class="tab-section-title">
            Table of Contents (TOC)
        </h2>
    `,
    tocEmpty: `
        <p class="text-muted">
            Contents for this issue are not available.
        </p>
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

export const TABLE_OF_CONTENTS = {
    /**
     * Main rendering function for the issue data.
     * It updates the UI based on the provided issue data or shows a 'no data' message.
     * @async
     * @param {object | null} issueData - The data for the issue to render.
     * Expected to be null if no data is found.
     */
    render: async function (issueData) {
        if (!issueData) {
            this._renderNoData();
            return;
        }

        try {
            this._updateCoverElements(issueData);
            this._renderContentsList(issueData);
        } catch (error) {
            
        }
    },

    /**
     * Renders a "no data" state in the UI when issue information is not available.
     * @private
     */
    _renderNoData: function () {
        if (ELEMENTS.issueNumber) ELEMENTS.issueNumber.textContent = 'N/A';
        if (ELEMENTS.tableOfContentsTabPanel) ELEMENTS.tableOfContentsTabPanel.innerHTML = HTML.messageNoData;

        ERROR_HANDLER.report(
            CONTEXT,
            ERRORS.NO_ISSUE_FOUND.code,
            ERRORS.NO_ISSUE_FOUND.message,
            { date: STATE.birthDateFromURL }
        );

        if (ELEMENTS.magazineCover) {
            ELEMENTS.magazineCover.src = PLACEHOLDERS.COVER_NO_DATA;
            ELEMENTS.magazineCover.alt = 'No data found for this date';
        }

        if (ELEMENTS.coverDate) ELEMENTS.coverDate.textContent = 'No data available for the selected birth date.';

        if (ELEMENTS.triviaTabButton) ELEMENTS.triviaTabButton.style.display = 'none';
        if (ELEMENTS.statsTabButton) ELEMENTS.statsTabButton.style.display = 'none';
        if (ELEMENTS.hiddenGemTabButton) ELEMENTS.hiddenGemTabButton.style.display = 'none';
        if (ELEMENTS.horoscopeTabButton) ELEMENTS.horoscopeTabButton.style.display = 'none';
    },

    /**
     * Updates the magazine cover image and issue details.
     * @private
     * @param {object} data - The issue data containing cover image URL, issue number, etc.
     */
    _updateCoverElements: function (data) {
        if (ELEMENTS.magazineCover) {
            ELEMENTS.magazineCover.src = data.cover_image || PLACEHOLDERS.COVER_NO_DATA;
            ELEMENTS.magazineCover.alt = data.issue_number ?
                `Cover of Shonen Jump Issue #${data.issue_number}` :
                'Shonen Jump Cover';
            ELEMENTS.magazineCover.onerror = function () {
                this.onerror = null;
                this.src = PLACEHOLDERS.COVER_ERROR;
                this.alt = 'Error loading cover image';

                ERROR_HANDLER.warn(
                    CONTEXT,
                    ERRORS.COVER_IMAGE_ERROR.code,
                    ERRORS.COVER_IMAGE_ERROR.message,
                    { date: STATE.birthDateFromURL, issueNumber: data.issue_number }
                )
            };
        }

        if (ELEMENTS.issueNumber) {
            ELEMENTS.issueNumber.textContent = data.issue_number || 'N/A';
        }
        if (ELEMENTS.coverDate) {
            ELEMENTS.coverDate.textContent = data.cover_date ?
                formatDateDisplay(data.cover_date) :
                'Date not available';
        }
    },

    _renderContentsList: function (data) {
        if (!ELEMENTS.contentsTabPanel) return;

        const html = new HtmlBuilder();
        html.add(HTML.tocTitle);

        if (data.table_of_contents?.length > 0) {
            html.add('<ul class="content-list">');
            data.table_of_contents.forEach(item => {
                html.add(HTML.tocItem(item.title));
            });
            html.add('</ul>');
        } else {
            html.add(HTML.tocEmpty);
        }

        ELEMENTS.contentsTabPanel.innerHTML = html.build();
    }
};
