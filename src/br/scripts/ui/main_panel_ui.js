import { RESULTS_ELEMENTS as ELEMENTS } from "../core/elements";
import {
    ERRORS
} from "../core/constants";
import ERROR_HANDLER from "../handlers/error_handler";
import { RESULTS_STATE as STATE } from "../core/state";
import { formatDateDisplay } from "../core/date_helper.js";

const HTML = {
    placeholderNoIssueData: `
        N/A
    `,
}

export const MAIN_PANEL_UI = {
    /**
     * The element for the issue number.
     * This is where the issue number will be displayed.
     * @type {HTMLElement}
     */
    issueNumber: ELEMENTS.PANELS.MAIN.issueNumber,

    /**
     * The element for the issue cover date.
     * This is where the issue cover date will be displayed.
     * @type {HTMLElement}
     */
    issueCoverDate: ELEMENTS.PANELS.MAIN.issueCoverDate,

    /**
     * Render the main panel with issue information.
     * This function updates the UI based on the provided issue data or shows a 'no data' message.
     */
    render: async function (issueData = STATE.ISSUE_DATA) {
        if (!issueData) {
            this._renderNoDataForIssue();
            return;
        }

        try {
            this._renderIssueInfo(issueData);
        } catch (error) {
            ERROR_HANDLER.report(
                STATE.context,
                ERRORS.MAIN_PANEL_ERROR.code,
                error.message,
                { date: STATE.birthDateFromURL }
            );
        }
    },

    _renderNoDataForIssue: function () {
        if (this.issueNumber) this.issueNumber.textContent = HTML.placeholderNoIssueData;
        if (this.issueCoverDate) this.issueCoverDate.textContent = HTML.placeholderNoIssueData;

        ERROR_HANDLER.report(
            STATE.context,
            ERRORS.NO_ISSUE_FOUND.code,
            ERRORS.NO_ISSUE_FOUND.message,
            { date: STATE.birthDateFromURL }
        );
    },

    _renderIssueInfo: function (issue) {
        if (!this.issueNumber || !this.issueCoverDate) throw new Error('ELEMENT NOT FOUND');

        this.issueNumber.textContent = issue.issue_number;
        this.issueCoverDate.textContent = formatDateDisplay(issue.cover_date);
    }
}