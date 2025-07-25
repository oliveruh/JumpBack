export const INDEX_STATE = {
    context: 'indexPage',
    birthdate: '',
    errorMessageText: '',
}

export const RESULTS_STATE = {
    context: 'resultsPage',
    currentIssueData: null,
    allSeriesData: null,
    activeTab: 'contentsTab',
    genreChartInstance: null,
    birthDateFromURL: null,

    ISSUE_DATA: null,
    ALL_SERIES_DATA: null,

    /**
     * Displays a loading spinner.
     * @param {boolean} show - Whether to show or hide the loading spinner.
     */
    showLoading: function(show) {
        elements.loadingContainer?.classList.toggle('visible', show);
    },
}