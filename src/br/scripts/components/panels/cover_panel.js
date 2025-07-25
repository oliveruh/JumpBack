import HtmlBuilder from "../../core/html_builder";

export const COVER_PANEL = ({ elements, state, htmlTemplates, errorHandler }) => {
    const { issueCoverImage } = elements.panels.cover;

    /**
     * Renders a message indicating that no issue data is available.
     * This function updates the UI to show a placeholder message.
     */
    const renderNoDataForIssue = () => {
        if (issueCoverImage) issueCoverImage.src = htmlTemplates.placeholderNoIssueData;

        errorHandler.report(
            state.context,
            null,
            htmlTemplates.messageNoIssueData,
            { date: state.birthDateFromURL }
        );
    };

    /**
     * Renders the cover image and date for the issue.
     * This function updates the UI with the cover image and date.
     * @param {object} issue - The issue data to render.
     */
    const renderCoverForIssue = (issue) => {
        if (!issueCoverImage) throw new Error('ELEMENT NOT FOUND');

        issueCoverImage.src = issue.cover_image;

        // Set the alt text for the cover image
        if (issueCoverImage.alt) {
            issueCoverImage.alt = `Cover image for issue ${issue.issue_number}`;
        }

        // Set the title for the cover image
        if (issueCoverImage.title) {
            issueCoverImage.title = `Cover image for issue ${issue.issue_number}`;
        }

    }

    /**
     * Renders the cover panel with issue data.
     * This function updates the UI based on the provided issue data or shows a 'no data' message.
     * @async
     * @param {object | null}
     * issueData - The data for the issue to render.
     * Expected to be null if no data is found.
     */
    const render = async (issueData = state.ISSUE_DATA) => {
        if (!issueData) {
            renderNoDataForIssue();
            return;
        }

        try {
            renderCoverForIssue(issueData);
        } catch (error) {
            errorHandler.report(
                state.context,
                null,
                error.message,
                { date: state.birthDateFromURL }
            );
        }
    }

    return { render };

}