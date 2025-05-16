import { PAGE_IDS } from '../core/constants.js';
import ANALYTICS from '../services/analytics_service.js';
import MASCOT_PANEL from '../ui/mascot_panels_ui.js';
import UI from '../ui/index_ui.js';

const initializeApplication = () => {
    console.info(`[APP] ${PAGE_IDS.INDEX} initialized.`);

    UI.setUpFindJumpButton();
    UI.configureDatePickerLimits();

    MASCOT_PANEL.render();

    UI.checkForErrorMessage();
};

const start = () => {
    console.info('[APP] homePage initialized.');

    ANALYTICS.trackPageView();

    try {
        initializeApplication();
    } catch (error) {
        console.error('[APP] Error initializing homePage:', error);
        ANALYTICS.trackError(
            PAGE_IDS.INDEX,
            'Initialization error',
            { error: error.message }
        );
    }
};

window.addEventListener('DOMContentLoaded', start);