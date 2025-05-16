const safeTrack = (event, data = {}) => {
    if (typeof umami?.track === 'function') {
        umami.track(event, data);
    } else {
        console.warn('[ANALYTICS] umami.track not available', { event, data });
    }
};

const safeTrackWith = (modifierFn) => {
    if (typeof umami?.track === 'function') {
        umami.track(modifierFn);
    } else {
        console.warn('[ANALYTICS] umami.track (with modifier) not available');
    }
};

const safeIdentify = (traits = {}) => {
    if (typeof umami?.identify === 'function') {
        umami.identify(traits);
    } else {
        console.warn('[ANALYTICS] umami.identify not available', { traits });
    }
};

const ANALYTICS = {
    /**
     * Tracks a error event.
     * @param {string} context - The context of the error (e.g., "homePage").
     * @param {string} errorMessage - The error message to track.
     * @param {Object} [extra] - Additional data to include with the event.
     */
    trackError: (context, errorMessage, extra = {}) => {
        safeTrack(`error:${context}`, { error: errorMessage, ...extra });
    },

    /**
     * Tracks a success event.
     * @param {string} context - The context of the success (e.g., "resultsPage").
     * @param {string} successMessage - The success message to track.
     * @param {Object} [extra] - Additional data to include with the event.
     */
    trackSuccess: (context, successMessage, extra = {}) => {
        safeTrack(`success:${context}`, { success: successMessage, ...extra });
    },

    /**
     * Tracks a redirect from homePage to resultsPage
     * @param {string} context - The context of the redirect (e.g., "homePage").
     * @param {string} dateValue - The birthDate value to track.
     */
    trackFromIndexToResults: (context, dateValue) => {
        safeTrack(`redirect:${context}:results`, { date: dateValue });
    },

    /**
     * Tracks a redirect from resultsPage to homePage
     * @param {string} context - The context of the redirect (e.g., "resultsPage").
     * @param {string} dateValue - The birthDate value to track.
     */
    trackFromResultsToIndex: (context, dateValue) => {
        safeTrack(`redirect:${context}:index`, { date: dateValue });
    },

    /** 
     * Track an interaction event.
     * @param {string} context - The context of the interaction (e.g., "homePage").
     * @param {string} element - The element that was interacted with (e.g., "button").
     * @param {string} [action='clicked'] - The action taken (e.g., "clicked").
     */
    trackInteraction: (context, element, action = 'clicked') => {
        safeTrack(`interaction:${context}:${element}`, { action });
    },

    /**
     * Tracks a page view event.
     */
    trackPageView: () => {
        safeTrackWith(props => ({
            ...props,
            url: window.location.pathname,
            title: document.title,
        }));
    },

    /**
     * Tracks a custom event.
     */
    trackWith: safeTrackWith,

    /**
     * Anonymously associates a birthDate with a visitor for debugging date-related bugs.
     * No personal identifiers are used or stored.
     */
    identifyUser: safeIdentify,

    /**
     * Track how long it takes to perform a function.
     * @param {string} context - The context of the timing (e.g., "resultsPage").
     * @param {string} label - The label for the timing (e.g., "fetchData").
     * @param {Function} fn - The function to time.
     * @returns {Promise} A promise that resolves to the result of the function.
     */
    withTiming: async (context, label, fn) => {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();

        safeTrack(`timing:${context}:${label}`, {
            durationMs: Math.round(end - start),
        });

        return result;
    }
};

export default ANALYTICS;
