import UTILS from '../core/utils.js';
import { DATA_PATHS } from '../core/constants.js';
import ANALYTICS from './analytics_service.js';
import { RESULTS_STATE as STATE } from '../core/state.js'; // To update currentMagazineData

const ISSUES_SERVICE = {
    /**
     * Fetches all WSJ issues.
     * @returns {Promise<Array|null>} Array of issues or null on error.
     */
    fetchAllIssues: async () => {
        try {
            const issues = await UTILS.fetchData(DATA_PATHS.ISSUES);
            if (!issues) {
                ANALYTICS.trackError('IssuesService', 'fetchAllIssues: No data returned');
            }
            return issues;
        } catch (error) {
            ANALYTICS.trackError('IssuesService', 'fetchAllIssues: Exception', { error: error.message });
            return null;
        }
    },

    /**
     * Finds the relevant magazine issue for a given date from a list of all issues.
     * @param {Array<Object>} allIssues - Array of all magazine issues.
     * @param {string} targetDateString - The target date in 'YYYY-MM-DD' format.
     * @returns {Object|null} The matching magazine object or null.
     */
    findMagazineForDate: (allIssues, targetDateString) => {
        if (!targetDateString || !allIssues || allIssues.length === 0) {
            if (!allIssues || allIssues.length === 0) {
                 ANALYTICS.trackError('IssuesService', 'findMagazineForDate: allIssues data is missing or empty.');
            }
            return null;
        }
        // Using the utility function from UTILS, or move the logic here if preferred
        return UTILS.findMagazineForDate(allIssues, targetDateString);
    },

    /**
     * Fetches and sets the current magazine data for a given birth date.
     * @param {string} birthDateString - The birth date to find the magazine for.
     * @returns {Promise<boolean>} True if magazine data was found and set, false otherwise.
     */
    loadCurrentMagazineForDate: async (birthDateString) => {
        const allWSJIssues = await IssuesService.fetchAllIssues();
        if (!allWSJIssues) {
            STATE.currentMagazineData = null;
            return false;
        }
        const birthdateMagazine = IssuesService.findMagazineForDate(allWSJIssues, birthDateString);
        STATE.currentMagazineData = birthdateMagazine; // Update shared state

        if (birthdateMagazine) {
            ANALYTICS.trackSuccess('IssuesService', 'WSJ data loaded successfully for date', { date: birthDateString });
            return true;
        } else {
            ANALYTICS.trackError('IssuesService', 'No magazine data found for the date', { date: birthDateString });
            return false;
        }
    }
};

export default ISSUES_SERVICE;