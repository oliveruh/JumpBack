export const PAGE_IDS = {
    INDEX: 'homePage',
    RESULTS: 'resultsPage',
};

export const DATE_LIMITS = {
    MAX: '2021-05-24',
    MIN: '1968-07-11',
};

export const DATA_PATHS = {
    ISSUES: './data/wsj_issues.json',
    SERIES: './data/wsj_series.json',
    MAGAZINE_TRIVIA: './data/wsj_trivia.json',
    HOROSCOPE: './data/wsj_horoscope.json',
    MASCOTS: './data/wsj_mascots.json',
};

export const PLACEHOLDERS = {
    COVER_ERROR: 'https://placehold.co/300x420/eeeeee/cc0000?text=Error+Loading+Cover',
    COVER_NO_DATA: 'https://placehold.co/300x420/eeeeee/cc0000?text=No+Cover+Found',
    HOROSCOPE_IMAGE_ERROR: 'https://placehold.co/100x100/eeeeee/333333?text=Image+Error',
};

export const CONFIG = {
    MAX_TRIVIA_ITEMS: 8,
    TOP_SERIES_COUNT: 3,
    TOP_TAGS_COUNT: 5,
    TOP_TAGS_LIST_COUNT: 10,
    HIDDEN_GEM_DESCRIPTION_LENGTH: 250,
    NAVIGATION_DELAY: 1200,
};

export const ROUTES = {
    indexPage: 'index.html',
    resultsPage: 'results.html',
};

export const ERRORS = {
    DATE_EMPTY: 'date_empty',
    DATE_INVALID: 'date_invalid',
    DATE_TOO_EARLY: 'date_too_early',
    DATE_IN_FUTURE: 'date_in_future',
    DATE_TOO_LATE: 'date_too_late',
    NO_ISSUE_FOUND: {
        code: 'no_issue_found',
        message: 'No information found for this date. Jump might not have been published, or our records are incomplete.',
    },
    COVER_IMAGE_ERROR: {
        code: 'cover_image_error',
        message: 'Error loading cover image.',
    },
    TABLE_OF_CONTENTS_ERROR: {
        code: 'table_of_contents_error',
        message: 'Error loading Table of Contents.',
    },
    MAIN_PANEL_ERROR: {
        code: 'main_panel_error',
        message: 'Error loading main panel data.',
    },
};