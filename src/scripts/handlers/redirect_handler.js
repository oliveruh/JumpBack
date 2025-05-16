import { INDEX_ELEMENTS as ELEMENTS } from '../core/elements.js';
import { INDEX_STATE as STATE } from '../core/state.js';
import {
    DATE_LIMITS,
    PAGE_IDS,
    ROUTES,
    CONFIG
} from '../core/constants.js';
import VALIDATION from '../services/validation_service.js';
import ANALYTICS from '../services/analytics_service.js';
import UI from '../ui/index_ui.js';

/**
 * Handles the find jump button click event.
 * Validates the date input and redirects to the results page if valid.
 */
export const redirectToResults = () => {
    // Validate the date input
    const dateValue = ELEMENTS.datePicker.value;
    const { valid, message, error } = VALIDATION.validateDateInput(
        dateValue,
        DATE_LIMITS.MIN,
        DATE_LIMITS.MAX
    );

    STATE.birthdate = dateValue;
    STATE.errorMessageText = message;

    // Update the error message in the UI
    UI.checkForErrorMessage();

    // If the date is not valid, track the error and return
    if (!valid) {
        ANALYTICS.trackError(
            PAGE_IDS.INDEX, 
            error, 
            { date: dateValue }
        );
        return;
    }

    // If the date is valid, track the success and redirect to the results page
    ANALYTICS.trackFromIndexToResults(PAGE_IDS.INDEX, dateValue);

    // Disable the find button and change its text
    if (ELEMENTS.findButton) {
        ELEMENTS.findButton.disabled = true;
        ELEMENTS.findButton.textContent = "Searching...";
    }

    // Redirect to the results page after a delay
    setTimeout(() => {
        window.location.href = `${ROUTES.resultsPage}?date=${STATE.birthdate}`;
    }, CONFIG.NAVIGATION_DELAY);
};