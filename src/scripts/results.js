document.addEventListener('DOMContentLoaded', function () {

    const extraPanelTrivia = [
        {
            "wsj_trivia_title": "Understanding the ToC",
            "wsj_trivia_content": "The 'Table of Contents' (ToC) in Weekly Shonen Jump generally reflects series popularity based on reader surveys. Higher-ranking series appear earlier in the magazine, often get special pages, and are less likely to be cancelled. This gives a weekly snapshot of what's trending with readers."
        },
        {
            "wsj_trivia_title": "Launching New Legends",
            "wsj_trivia_content": "Weekly Shonen Jump regularly introduces new series, often with a bang — prominent cover or vibrant color pages to catch the reader's eye, just like One Piece's debut in this 1997 issue. However, this spotlight means they're tested by reader reception and must prove their mettle to survive and thrive in the competitive magazine."
        },
        {
            "wsj_trivia_title": "The Editors' Hand",
            "wsj_trivia_content": "Behind every great WSJ manga is a dedicated editor. These editors work closely with the artists, providing feedback on everything from story pacing and character development to art details. They act as a crucial first audience and guide, playing a significant role in shaping a series for success and helping to decide which new stories make it into the magazine."
        },
        {
            "wsj_trivia_title": "Beyond the Weekly: Tankōbon",
            "wsj_trivia_content": "While chapters debut weekly, successful series get their stories compiled into 'tankōbon' (collected volumes) every few months under the 'Jump Comics' imprint. These volumes are a major indicator of a series' popularity and financial success, allowing fans to collect their favorite adventures and often including extra content from the mangaka."
        },
        {
            "wsj_trivia_title": "The Competitive Edge",
            "wsj_trivia_content": "The reader surveys don't just determine top spots; they also influence which series might face 'the axe.' Manga that consistently rank poorly and fail to connect with the audience, especially newer ones after an initial grace period, risk cancellation to make space for fresh stories. This competitive environment keeps the magazine's lineup dynamic."
        },
        {
            "wsj_trivia_title": "The \"Golden Age\"",
            "wsj_trivia_content": "The mid-to-late 90s, when this issue was released, is often considered part of a 'Golden Age' for Weekly Shonen Jump. This era was marked by a lineup of exceptionally popular and influential series running simultaneously, leading to massive circulation numbers and a huge cultural impact both in Japan and increasingly, worldwide."
        }
    ]

    // --- Element References ---
    const elements = {
        loadingContainer: document.getElementById('loadingContainer'),
        magazineCover: document.getElementById('magazineCover'),
        issueNumber: document.getElementById('issueNumber'),
        coverDate: document.getElementById('coverDate'),
        contentsTabContent: document.getElementById('contentsTabPanel'),
        factsTabContent: document.getElementById('factsTabPanel'),
        triviaTabContent: document.getElementById('triviaTabPanel'),
        tabs: document.querySelectorAll('.tab-navigation .tab'),
        tabContents: document.querySelectorAll('.tab-content-container .tab-content'),
        backButton: document.getElementById('backButton'),
        shareButton: document.getElementById('shareButton'),
        extraPanelContent: document.querySelector('.extra-panel-content')
    };

    // --- Application State ---
    const state = {
        currentMagazineData: null,
        activeTab: 'contentsTab' // Default active tab (corresponds to data-tab="contentsTab")
    };

    // --- Show/Hide Loading Indicator ---
    function showLoading(show) {
        if (elements.loadingContainer) {
            elements.loadingContainer.classList.toggle('visible', show);
        }
    }

    // --- Populate "Behind the Cover" Panel ---
    function populateExtraPanel() {
        if (elements.extraPanelContent) {
            // Select a random entry from extraPanelTrivia
            const randomIndex = Math.floor(Math.random() * extraPanelTrivia.length);
            const randomTrivia = extraPanelTrivia[randomIndex];

            // Format the trivia into HTML
            let triviaHTML = `<h3>${randomTrivia.wsj_trivia_title}</h3>`;
            triviaHTML += `<p>${randomTrivia.wsj_trivia_content}</p>`;

            elements.extraPanelContent.innerHTML = triviaHTML;
        }
    }

    // --- Add Heading to Content ---
    function addHeadingToContent(htmlString, newH2Text) {
        const container = document.createElement('div');
        container.innerHTML = htmlString;

        const firstList = container.querySelectorAll('ul, ol')[0];

        const prev = firstList.previousElementSibling;

        const newHeading = document.createElement('h2');
        newHeading.textContent = newH2Text;

        if (prev) {
            prev.replaceWith(newHeading);
        } else {
            firstList.parentNode.insertBefore(newHeading, firstList);
        }

        return container.innerHTML;
    }

    // --- Populate Results Page ---
    function populateResultsPage(data) {
        if (!data) {
            if (elements.magazineCover) {
                elements.magazineCover.src = 'https://placehold.co/300x420/eeeeee/cc0000?text=No+Data+Found';
                elements.magazineCover.alt = 'No data found for this date';
            }
            if (elements.issueNumber) elements.issueNumber.textContent = 'N/A';
            if (elements.coverDate) elements.coverDate.textContent = 'No data available for the selected birth date.';

            // Ensure elements exist before setting innerHTML
            if (elements.contentsTabContent) elements.contentsTabContent.innerHTML = '<p>Sorry, no information found for the selected date. Perhaps it was a week Jump was not published, or our records for this specific date are incomplete.</p>';
            if (elements.factsTabContent) elements.factsTabContent.innerHTML = '<p>No facts available.</p>';
            if (elements.triviaTabContent) elements.triviaTabContent.innerHTML = '<p>No trivia available.</p>';

            populateExtraPanel();

            umami.track('[RESULTS PAGE] Got an error', { 'error': "WSJ Data for this date not found or incomplete.", 'date': getDateFromURL() });

            return;
        }

        state.currentMagazineData = data;

        if (elements.magazineCover) {
            elements.magazineCover.src = data.cover_image;
            elements.magazineCover.alt = `Cover of Shonen Jump Issue #${data.issue_number}`;
            elements.magazineCover.onerror = function () {
                this.onerror = null;
                this.src = 'https://placehold.co/300x420/eeeeee/cc0000?text=Cover+Error';
                this.alt = 'Error loading cover image';
            };
        }

        if (elements.issueNumber) elements.issueNumber.textContent = data.issue_number;

        if (elements.coverDate) {
            const dateObj = new Date(data.cover_date + 'T00:00:00');
            elements.coverDate.textContent = dateObj.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        }

        // Adjust TOC data to include a heading
        let description_html = addHeadingToContent(data.description, "Table of Contents (TOC)");

        // Adjust trivia data to add heading and list items
        let trivia_html = '<h2>Trivia</h2>';
        trivia_html += '<ul>\n';
        for (const item of data.trivia) {
            trivia_html += `  <li>${item}</li>\n`;
        }
        trivia_html += '</ul>';

        if (elements.contentsTabContent) elements.contentsTabContent.innerHTML = description_html || "<h2>Table of Contents (TOC)</h2><p>Contents for this issue are not available.</p>";
        if (elements.factsTabContent) elements.factsTabContent.innerHTML = data.facts_html || "<h2>Interesting Facts</h2><p>Interesting facts for this issue are not available.</p>";
        if (elements.triviaTabContent) elements.triviaTabContent.innerHTML = trivia_html || "<h2>Trivia</h2><p>No trivia available for this issue.</p>";

        populateExtraPanel();

        const defaultActiveTabButton = document.querySelector(`.tab-navigation .tab[data-tab="${state.activeTab}"]`);
        if (defaultActiveTabButton) {
            handleTabClick(defaultActiveTabButton);
        } else {
            umami.track('[RESULTS PAGE] Got an error', { 'error': "Default active tab button not found"});
            console.warn("Default active tab button not found for:", state.activeTab);
            if (elements.tabs.length > 0) {
                handleTabClick(elements.tabs[0]); 
            }
        }
    }

    // --- Handle Tab Click ---
    function handleTabClick(clickedTab) {
        if (!clickedTab || !elements.tabs || !elements.tabContents) return;

        elements.tabs.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
            tab.setAttribute('tabindex', '-1');
        });

        elements.tabContents.forEach(content => {
            if (content) { 
                content.classList.add('hidden');
            }
        });

        clickedTab.classList.add('active');
        clickedTab.setAttribute('aria-selected', 'true');
        clickedTab.setAttribute('tabindex', '0');

        const tabDataSetValue = clickedTab.dataset.tab; 

        const contentPanelId = tabDataSetValue + "Panel";
        state.activeTab = tabDataSetValue; 

        const activeContent = document.getElementById(contentPanelId);

        if (activeContent) {
            umami.track('[RESULTS PAGE] Tab clicked', { 'tab': tabDataSetValue });
            activeContent.classList.remove('hidden');
        } else {
            umami.track('[RESULTS PAGE] Got an error', { 'error': "Content panel not found", 'contentPanelId': contentPanelId });
            console.warn("Content panel not found for ID:", contentPanelId);
        }
    }

    /**
     * Gets the 'date' parameter from the current URL's query string.
     * @returns {string|null} The date string if found, otherwise null.
     */
    function getDateFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('date'); // Format: YYYY-MM-DD
    }

    /**
     * Fetches magazine data from a JSON file.
     * @param {string} filePath - The path to the JSON file.
     * @returns {Promise<Array<Object>>} A promise that resolves with the array of magazine data.
     */
    async function fetchMagazineData(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                umami.track('[RESULTS PAGE] Got an error', { 'error': `HTTP error! status: ${response.status}`, 'filePath': filePath });
                throw new Error(`HTTP error! status: ${response.status} while fetching ${filePath}`);
            }
            const data = await response.json();

            return data;
        } catch (error) {
            umami.track('[RESULTS PAGE] Got an error', { 'error': `Failed to fetch magazine data: ${error.message}`, 'filePath': filePath });
            console.error("Failed to fetch magazine data:", error);
            return []; 
        }
    }

    /**
     * Finds the latest magazine released on or before a given target date.
     * @param {Array<Object>} magazines - Array of magazine objects. Each object must have a 'cover_date' (YYYY-MM-DD).
     * @param {string} targetDateString - The target date in 'YYYY-MM-DD' format.
     * @returns {Object|null} The magazine object that matches the criteria, or null if none found.
     */
    function findMagazineForDate(magazines, targetDateString) {
        if (!targetDateString || !magazines || magazines.length === 0) {
            return null;
        }

        const targetDate = new Date(targetDateString);

        let suitableMagazine = null;

        for (const magazine of magazines) {
            const magazineCoverDate = new Date(magazine.cover_date);

            if (magazineCoverDate <= targetDate) {
                if (!suitableMagazine || magazineCoverDate > new Date(suitableMagazine.cover_date)) {
                    suitableMagazine = magazine;
                }
            }
        }
        return suitableMagazine;
    }

    // --- Share Functionality ---
    function shareResult() {
        if (!state.currentMagazineData) {
            alert("No result loaded to share yet!");
            return;
        }

        const birthDateFromURL = getDateFromURL() || "your birthdate";
        const issueCoverDate = elements.coverDate ? elements.coverDate.textContent : state.currentMagazineData.cover_date;
        const shareText = `On my birthdate (${birthDateFromURL}), the Shonen Jump issue was #${state.currentMagazineData.issue_number} (cover date: ${issueCoverDate})! Check out JumpBack to find yours!`;
        const shareUrl = window.location.href;

        if (navigator.share) {
            navigator.share({
                title: 'My Birth Jump!',
                text: shareText,
                url: shareUrl
            }).then(() => {
                umami.track('[RESULTS PAGE] Clicked to share the result', { 'date': birthDateFromURL, 'issue_number': state.currentMagazineData.issue_number, 'cover_date': issueCoverDate});
                console.log('Successful share')
            }).catch((error) => {
                umami.track('[RESULTS PAGE] Got and error', { 'error': 'Tried sharing, but failed. errorMessage: ' + error.message, 'date': birthDateFromURL });
                console.log('Error sharing:', error)}
            );
        } else {
            prompt("Copy this to share:", `${shareText} ${shareUrl}`);
        }
    }

    // -- Custom description for meta tags --
    function addCustomDescriptions(birthDateFromURL) {
        const defaultDescription = "Enter a date to find the Shonen Jump from that day!";
        if (!birthDateFromURL) {
            document.title = "JumpBack - No date provided!";
        } else {
            const issueCoverDate = elements.coverDate ? elements.coverDate.textContent : state.currentMagazineData.cover_date;
            defaultDescription = `On my birthdate (${birthDateFromURL}), the Shonen Jump issue was #${state.currentMagazineData.issue_number} (cover date: ${issueCoverDate})! Check out JumpBack to find yours!`;
            document.title = `JumpBack - Issue #${state.currentMagazineData.issue_number} (${issueCoverDate})`;
        }

        const metaDescTag = document.querySelector('meta[name="description"]');
        if (metaDescTag) metaDescTag.setAttribute('content', defaultDescription);

        const ogDescTag = document.querySelector('meta[property="og:description"]');
        if (ogDescTag) ogDescTag.setAttribute('content', defaultDescription);

        const twitterDescTag = document.querySelector('meta[name="twitter:description"]');
        if (twitterDescTag) twitterDescTag.setAttribute('content', defaultDescription);
    }

    // --- Initial Load ---
    function initializePage() {
        showLoading(true);

        const birthDateFromURL = getDateFromURL();

        if (!birthDateFromURL) {
            umami.track('[RESULTS PAGE] No date provided in URL');
            console.warn("No date provided in URL");
            addCustomDescriptions(null);
            showLoading(false);
            return;
        }

        addCustomDescriptions(birthDateFromURL);
        umami.track(props => ({ ...props, date: birthDateFromURL }));
        umami.identify({ date: birthDateFromURL });

        setTimeout(async () => {
            const allWSJIssues = await fetchMagazineData('./data/wsj_info.json');

            const birthdateMagazine = findMagazineForDate(allWSJIssues, birthDateFromURL);

            if (birthdateMagazine) {
                umami.track('[RESULTS PAGE] WSJ Data loaded', { 'cover_date': birthdateMagazine.cover_date, 'issue_number': birthdateMagazine.issue_number });
                console.log("Found magazine data:", birthdateMagazine);
            } else {
                umami.track('[RESULTS PAGE] Got an error', { 'error': 'No WSJ data found for this date.', 'date': birthDateFromURL });
                console.log("No specific magazine data found for the date.");
            }

            populateResultsPage(birthdateMagazine);

            showLoading(false);
        }, 1200);

        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => handleTabClick(tab));
            tab.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTabClick(tab);
                }
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const currentTabIndex = Array.from(elements.tabs).indexOf(tab);
                    const nextTab = elements.tabs[(currentTabIndex + 1) % elements.tabs.length];
                    nextTab?.focus();
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const currentTabIndex = Array.from(elements.tabs).indexOf(tab);
                    const prevTab = elements.tabs[(currentTabIndex - 1 + elements.tabs.length) % elements.tabs.length];
                    prevTab?.focus();
                }
            });
        });

        elements.backButton?.addEventListener('click', () => {
            umami.track('[RESULTS PAGE] Went back to the start page');
            window.location.href = 'index.html';
        });
        elements.shareButton?.addEventListener('click', shareResult);
    }

    initializePage();
});
