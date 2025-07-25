import { redirectToResults } from "../handlers/redirect_handler.js";
import { INDEX_ELEMENTS as ELEMENTS } from '../core/elements.js';
import { DATE_LIMITS } from "../core/constants.js";
import { INDEX_STATE as STATE } from "../core/state.js";

const UI = {
    /**
     * Attaches event listeners to the Find button and the date input.
     */
    setUpFindJumpButton: () => {
        ELEMENTS.findButton?.addEventListener('click', redirectToResults);

        ELEMENTS.datePicker?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                redirectToResults();
            }
        });
    },

    /**
     * Applies min and max date limits to the date input.
     */
    configureDatePickerLimits: () => {
        if (!ELEMENTS.datePicker) return;

        ELEMENTS.datePicker.max = DATE_LIMITS.MAX;
        ELEMENTS.datePicker.min = DATE_LIMITS.MIN;
    },
    
    /**
     * Shows an error message if one exists in the global state.
     */
    checkForErrorMessage: () => {
        if (ELEMENTS.errorMessage) {
            ELEMENTS.errorMessage.textContent = STATE.errorMessageText;
            ELEMENTS.errorMessage.style.display = STATE.errorMessageText ? 'block' : 'none';
        }
    }
}
export default UI;