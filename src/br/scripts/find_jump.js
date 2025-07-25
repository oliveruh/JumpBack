'use strict';

import ELEMENTS from './dom_elements.js';
import STATE from './state.js';
import CONSTANTS from './constants.js';
import { checkForErrorMessage } from './ui.js';

const TIME_SUFFIX = 'T00:00:00';

const validateDate = () => {
    if (!ELEMENTS.datePicker || !ELEMENTS.datePicker.value) {
        umami.track('[START PAGE] Got an error', { 'error': 'No date selected' });
        STATE.errorMessageText = 'Please select a date.';

        checkForErrorMessage();
        
        return false; 
    }

    const selectedDate = new Date(ELEMENTS.datePicker.value + TIME_SUFFIX);
    const minDate = new Date(CONSTANTS.minDateAllowed + TIME_SUFFIX);
    const today = new Date().setHours(0, 0, 0, 0); 

    STATE.errorMessageText = ''; 

    if (isNaN(selectedDate.getTime())) {
        umami.track('[START PAGE] Got an error', { 'error': 'Picked a date that is not valid', 'date': ELEMENTS.datePicker.value });
        STATE.errorMessageText = 'Please enter a valid date.';
    } else if (selectedDate < minDate) {
        umami.track('[START PAGE] Got an error', { 'error': 'Picked a date before Shonen Jump started', 'date': ELEMENTS.datePicker.value });
        STATE.errorMessageText = 'Weekly Shonen Jump started on July 11, 1968.';
    } else if (selectedDate > today) {
        umami.track('[START PAGE] Got an error', { 'error': 'Picked a date in the future', 'date': ELEMENTS.datePicker.value });
        STATE.errorMessageText = 'Time travel not invented yet! Select a past date.';
    } else if (selectedDate > new Date('2021-05-24T00:00:00')) {
        umami.track('[START PAGE] Got an error', { 'error': 'Picked a date we don\'t have data for', 'date': ELEMENTS.datePicker.value });
        STATE.errorMessageText = 'Sorry, we only have data until May 24, 2021.';
    }

    checkForErrorMessage();
    return !STATE.errorMessageText; 
}

const findJump = () => {
    if (!ELEMENTS.datePicker) return;

    STATE.birthdate = ELEMENTS.datePicker.value;

    if (!validateDate() || !STATE.birthdate) {
        return;
    }

    if (ELEMENTS.findButton) {
        ELEMENTS.findButton.disabled = true; 
        ELEMENTS.findButton.textContent = "Searching...";
    }

    umami.track('[START PAGE] Picked a date successfully', { 'date': STATE.birthdate });

    setTimeout(() => {
        console.log(`Loading issue for ${STATE.birthdate}. Navigating...`);

        window.location.href = `results.html?date=${STATE.birthdate}`;
    }, CONSTANTS.initialLoadDelay);
}

export { findJump };