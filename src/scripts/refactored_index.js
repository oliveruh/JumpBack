import { ANALYTICS } from './services/analytics_service.js';
import UI from './ui/index_ui.js';

import {    
            setUpFindJumpButton, 
            loadMascotsPanel,
            configureDatePickerLimits, 
            checkForErrorMessage 
        } from './ui.js';

const initializeApplication = () => {
    console.log('Application initialized');

    ANALYTICS.track();

    setUpFindJumpButton();
    configureDatePickerLimits();

    loadMascotsPanel();
    UI.checkForErrorMessage();
};

window.addEventListener('DOMContentLoaded', initializeApplication);