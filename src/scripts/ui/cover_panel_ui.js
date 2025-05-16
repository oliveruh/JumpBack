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
}

export const COVER_PANEL = {
    /**
     * The container element for the cover panel.
     * This is where the cover image and date will be rendered.
     * @type {HTMLElement}
     */
    coverImage: ELEMENTS.PANELS.COVER.issueCoverImage,

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
            this._renderCoverForIssue(issueData);
        } catch (error) {
            ERROR_HANDLER.report(
                STATE.context,
                ERRORS.COVER_IMAGE_ERROR.code,
                error.message,
                { date: STATE.birthDateFromURL }
            );
        }
    },

    /**
     * Renders a message indicating that no issue data is available.
     * This function updates the UI to show a placeholder message.
     */
    _renderNoDataForIssue: function () {
        if (this.coverImage) this.coverImage.src = HTML.placeholderNoIssueData;

        ERROR_HANDLER.report(
            STATE.context,
            ERRORS.NO_ISSUE_FOUND.code,
            ERRORS.NO_ISSUE_FOUND.message,
            { date: STATE.birthDateFromURL }
        );
    },

    /**
     * Renders the cover image and date for the issue.
     * This function updates the UI with the cover image and date.
     * @param {object} issue - The issue data to render.
     */
    _renderCoverForIssue: function (issue) {
        if (!this.coverImage) throw new Error('ELEMENT NOT FOUND');

        this.coverImage.src = issue.cover_image;

        // Set the alt text for the cover image
        if (this.coverImage.alt) {
            this.coverImage.alt = `Cover image for issue ${issue.issue_number}`;
        }

        // Set the title for the cover image
        if (this.coverImage.title) {
            this.coverImage.title = `Cover image for issue ${issue.issue_number}`;
        }

    }
}