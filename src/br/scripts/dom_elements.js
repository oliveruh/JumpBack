const ELEMENTS = {
    indexPage: {
        datePicker: document.getElementById('birthdatePicker'),
        findButton: document.getElementById('findButton'),
        errorMessage: document.getElementById('errorMessage'),
        mascot: {
            mascotTopSpeechBubble: document.getElementById('mascotTopSpeechBubble'),
            mascotTopImageContainer: document.getElementById('mascotTopImage'),
            mascotBottomSpeechBubble: document.getElementById('mascotBottomSpeechBubble'),
            mascotBottomImageContainer: document.getElementById('mascotBottomImage')
        }
    },
    loadingContainer: document.getElementById('loadingContainer'),
    magazineCover: document.getElementById('magazineCover'),
    issueNumber: document.getElementById('issueNumber'),
    coverDate: document.getElementById('coverDate'),
    contentsTabPanel: document.getElementById('contentsTabPanel'),
    triviaTabPanel: document.getElementById('triviaTabPanel'),
    statsTabPanel: document.getElementById('statsTabPanel'),
    hiddenGemTabPanel: document.getElementById('hiddenGemTabPanel'),
    horoscopeTabPanel: document.getElementById('horoscopeTabPanel'),
    tabs: document.querySelectorAll('.tab-navigation .tab'),
    tabContents: document.querySelectorAll('.tab-content-container .tab-content'),
    backButton: document.getElementById('backButton'),
    shareButton: document.getElementById('shareButton'),
    extraPanelContent: document.querySelector('.extra-panel-content'),
};

export default ELEMENTS;