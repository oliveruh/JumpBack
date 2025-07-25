import UTILS from "../core/utils.js";
import ANALYTICS from "../services/analytics_service.js";
import VALIDATION from "../services/validation_service.js";
import { RESULTS_STATE as STATE } from "../core/state.js";
import { 
    PAGE_IDS,
    DATA_PATHS,
    CONFIG
 } from "../core/constants";
import { RESULTS_ELEMENTS as ELEMENTS } from "../core/elements.js";
import { UI } from "../ui/results_ui.js";

const initializeApplication = async () => {
    STATE.showLoading(true);
    STATE.birthDateFromURL = UTILS.getDateFromURL();

    if (!STATE.birthDateFromURL) {
        console.error('[APP] No date found in URL.');

        ANALYTICS.trackError(
            PAGE_IDS.RESULTS_PAGE, 
            'No date found in URL', 
            { date: STATE.birthDateFromURL }
        );

        //UIUpdaters.populateResultsPage(null); // Show empty/error state
        //await UIUpdaters.displayHoroscope(null); // Handle null date for horoscope
        //UIUpdaters.updateMetaTags(); // Update meta tags for SEO

        STATE.showLoading(false);
        return;
    }

    const { isValid, message, error } = VALIDATION.validateDateInput(STATE.birthDateFromURL)

    if (!isValid) {
        console.error(`[APP] ${error}: ${message}`);

        ANALYTICS.trackError(
            PAGE_IDS.RESULTS_PAGE, 
            error, 
            { date: STATE.birthDateFromURL }
        );

        ELEMENTS.contentsTabPanel.innerHTML = `
            <p class="text-error placeholder-text">
                ${message}
            </p>`;

        STATE.showLoading(false);
        return;
    }

    ANALYTICS.trackPageView();
    ANALYTICS.identifyUser(STATE.birthDateFromURL);

    STATE.allSeriesData = UTILS.fetchData(DATA_PATHS.SERIES);
    if (!STATE.allSeriesData) {
        console.error('[APP] Failed to fetch all series data.');

        ANALYTICS.trackError(
            PAGE_IDS.RESULTS_PAGE, 
            'Failed to fetch all series data', 
            { date: STATE.birthDateFromURL }
        );

        ELEMENTS.contentsTabPanel.innerHTML = `
            <p class="text-error placeholder-text">
                Could not load essential series data. Please try refreshing.
            </p>`;

        return;
    }

    setTimeout(async () => {
        const allWSJIssues = await UTILS.fetchData(DATA_PATHS.ISSUES);
        const birthdateMagazine = allWSJIssues ? UTILS.findMagazineForDate(allWSJIssues, STATE.birthDateFromURL) : null;

        if (birthdateMagazine) {
            console.info('[APP] WSJ data loaded successfully.');
            ANALYTICS.trackSuccess(
                PAGE_IDS.RESULTS,
                'WSJ data loaded successfully',
                { date: STATE.birthDateFromURL }
            )
        } else {
            console.error("No specific magazine data found for the date:", STATE.birthDateFromURL);
            ANALYTICS.trackError(
                PAGE_IDS.RESULTS,
                'No magazine data found for the date',
                { date: STATE.birthDateFromURL }
            );
        }

        UI.renderTabs(birthdateMagazine);
        SEO.load();
        //UIUpdaters.populateResultsPage(birthdateMagazine);
        //await UIUpdaters.displayHoroscope(STATE.birthDateFromURL);

        STATE.showLoading(false);

    }, CONFIG.NAVIGATION_DELAY);

}

const start = () => {
    console.info(`[APP] ${PAGE_IDS.RESULTS} initialized.`);

    ANALYTICS.trackPageView();
    
    EventHandlers.setupEventListeners();

    initializeApplication().catch(error => {
        console.error('[APP] Error initializing application:', error);
        ANALYTICS.trackError(
            PAGE_IDS.RESULTS,
            'Error initializing application',
            { error: error.message }
        );

        STATE.showLoading(false);

        // Display a generic error message on the page
        document.body.innerHTML = `
            <div class="container" style="padding:20px; text-align:center;">
                <h1 style="color:var(--error-color);">Oops! Something went wrong.</h1>
                <p>We encountered an error while loading the page. Please try refreshing, or come back later.</p>
                <p><a href="index.html" class="button button-primary">Go Back</a></p>
            </div>`;
        }
    );
}

window.addEventListener('DOMContentLoaded', start);