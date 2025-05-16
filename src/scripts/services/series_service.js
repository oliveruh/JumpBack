import UTILS from '../core/utils.js';
import { DATA_PATHS } from '../core/constants.js';
import ANALYTICS from './analytics_service.js'; // For error tracking during fetch
import { RESULTS_STATE as STATE } from '../core/state.js'; // To potentially update state or read it

const SERIES_SERVICE = {
    /**
     * Fetches all series data and stores it in the shared STATE.
     * @returns {Promise<boolean>} True if successful, false otherwise.
     */
    fetchAllSeriesData: async () => {
        try {
            const seriesData = await UTILS.fetchData(DATA_PATHS.SERIES);
            if (seriesData) {
                STATE.allSeriesData = seriesData; // Update shared state
                return true;
            }
            ANALYTICS.trackError('SeriesService', 'fetchAllSeriesData: No data returned');
            return false;
        } catch (error) {
            ANALYTICS.trackError('SeriesService', 'fetchAllSeriesData: Exception', { error: error.message });
            return false;
        }
    },

    /**
     * Gets a series by its ID from the globally stored series data.
     * Relies on STATE.allSeriesData being populated.
     * @param {string|number} seriesId - The ID of the series.
     * @returns {Object|null} The series object or null if not found.
     */
    getSeriesById: (seriesId) => {
        if (!STATE.allSeriesData || !seriesId) {
            if (!STATE.allSeriesData) {
                ANALYTICS.trackError('SeriesService', 'getSeriesById: allSeriesData not loaded in STATE.');
            }
            return null;
        }
        return STATE.allSeriesData.find(s => String(s.id) === String(seriesId));
    },

    // You could add more series-specific logic here, e.g.,
    // findSeriesByAuthor, filterSeriesByGenre, etc.
};

export default SERIES_SERVICE;