const CONSTANTS = {
    indexPageIdentifier: '[START PAGE]',
    resultsPageIdentifier: '[RESULTS PAGE]',

    // --- INDEX Page ---
    maxDateAllowed: '2021-05-24', // Data only goes up to this date
    minDateAllowed: '1968-07-11', // WSJ started publishing on this date

    // --- RESULTS Page ---
    dataPaths: {
        issues: './data/wsj_issues.json',
        series: './data/wsj_series.json',
        trivia: './data/wsj_trivia.json',
        horoscope: './data/wsj_horoscope.json',
        mascots: './data/wsj_mascots.json',
    },
    placeholders: {
        coverError: 'https://placehold.co/300x420/eeeeee/cc0000?text=Error+Loading+Cover',
        coverNoData: 'https://placehold.co/300x420/eeeeee/cc0000?text=No+Cover+Found',
        horoscopeImageError: 'https://placehold.co/100x100/eeeeee/333333?text=Image+Error',
    },
    maxTriviaItems: 8,
    topSeriesCount: 3,
    topTagsCount: 5, 
    topTagsListCount: 10, 
    hiddenGemDescriptionLength: 250,
    initialLoadDelay: 1200, 
};

export default CONSTANTS;