const UTILS = {
    /**
     * Fetches JSON data from a specified file path.
     * @param {string} filePath - The path to the JSON file.
     * @returns {Promise<Array<Object>|Object|null>} A promise that resolves with the fetched data or null on error.
     */
    fetchData: async function (filePath) {
        try {
            const response = await fetch(filePath);

            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status} while fetching ${filePath}`);
                umami?.track('[RESULTS PAGE] Got an error', { error: `HTTP ${response.status}`, filePath });

                return null;
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch data from ${filePath}:`, error);
            umami?.track('[RESULTS PAGE] Got an error', { error: error.message, filePath });

            return null;
        }
    },

    /**
     * Displays a loading spinner.
     * @param {boolean} show - Whether to show or hide the loading spinner.
     */
    showLoading: function(show) {
        elements.loadingContainer?.classList.toggle('visible', show);
    },

    /**
     * Gets the current date from the URL parameters.
     * @returns {string|null} The date value from the URL or null if not found.
     */
    getDateFromURL: function() {
            const params = new URLSearchParams(window.location.search);
            return params.get('date');
    },

};
export default UTILS;