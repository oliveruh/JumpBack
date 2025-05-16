import { ERRORS } from "../core/constants.js";

const TIME_SUFFIX = 'T00:00:00';

const VALIDATION = {
    validateDateInput: (dateValue, minDateAllowed, maxDateAllowed) => {
        if (!dateValue) return { valid: false, message: 'Please select a date.', error: ERRORS.DATE_EMPTY };

        const selectedDate = new Date(dateValue + TIME_SUFFIX);
        const minDate = new Date(minDateAllowed + TIME_SUFFIX);
        const maxDate = new Date(maxDateAllowed + TIME_SUFFIX);
        const today = new Date().setHours(0, 0, 0, 0);

        if (isNaN(selectedDate.getTime())) {
            return { valid: false, message: 'Please enter a valid date.', error: ERRORS.DATE_INVALID };
        }

        if (selectedDate < minDate) {
            return { valid: false, message: 'Weekly Shonen Jump started on July 11, 1968.', error: ERRORS.DATE_TOO_EARLY };
        }

        if (selectedDate > today) {
            return { valid: false, message: 'Time travel not invented yet! Select a past date.', error: ERRORS.DATE_IN_FUTURE };
        }

        if (selectedDate > maxDate) {
            return { valid: false, message: 'Sorry, we only have data until May 24, 2021.', error: ERRORS.DATE_TOO_LATE };
        }

        return { valid: true };
    }
}

export default VALIDATION;