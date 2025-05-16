import { EXTRA_PANEL } from "../ui/extra_panel_ui";
import { MAIN_PANEL_UI } from "../ui/main_panel_ui";

export const INDEX_ELEMENTS = {
    datePicker: document.getElementById('birthdatePicker'),
    findButton: document.getElementById('findButton'),
    errorMessage: document.getElementById('errorMessage'),
    mascot: {
        mascotTopSpeechBubble: document.getElementById('mascotTopSpeechBubble'),
        mascotTopImageContainer: document.getElementById('mascotTopImage'),
        mascotBottomSpeechBubble: document.getElementById('mascotBottomSpeechBubble'),
        mascotBottomImageContainer: document.getElementById('mascotBottomImage')
    }
};

export const RESULTS_ELEMENTS = {
    TABS: {
        allTabs: document.querySelectorAll('.tab-navigation .tab'),
        allTabsContents: document.querySelectorAll('.tab-content-container .tab-content'),
        
        TOC: {
            container: document.getElementById('contentsTabPanel'),
            tabButton: document.getElementById('contentsTabButton'),
        },

        TRIVIA: {
            container: document.getElementById('triviaTabPanel'),
            tabButton: document.getElementById('triviaTabButton'),
        },

        STATS: {
            container: document.getElementById('statsTabPanel'),
            tabButton: document.getElementById('statsTabButton'),
        },

        HIDDEN_GEM: {
            container: document.getElementById('hiddenGemTabPanel'),
            tabButton: document.getElementById('hiddenGemTabButton'),
        },

        HOROSCOPE: {
            container: document.getElementById('horoscopeTabPanel'),
            tabButton: document.getElementById('horoscopeTabButton'),
        }
    },

    PANELS: {

        COVER: {
            issueCoverImage: document.getElementById('magazineCover'),
        },

        EXTRA: {
            container: document.querySelector('.extra-panel-content'),
        },

        MAIN: {
            issueNumber: document.getElementById('issueNumber'),
            issueCoverDate: document.getElementById('coverDate'),
        },


    },

    BUTTONS: {
        findButton: document.getElementById('findButton'),
        backButton: document.getElementById('backButton'),
        shareButton: document.getElementById('shareButton')
    },


};
