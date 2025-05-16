document.addEventListener('DOMContentLoaded', function () {

    // --- Element References ---
    const elements = {
        loadingContainer: document.getElementById('loadingContainer'),
        magazineCover: document.getElementById('magazineCover'),
        issueNumber: document.getElementById('issueNumber'),
        coverDate: document.getElementById('coverDate'),
        contentsTabContent: document.getElementById('contentsTabPanel'),
        triviaTabContent: document.getElementById('triviaTabPanel'),
        tabs: document.querySelectorAll('.tab-navigation .tab'),
        tabContents: document.querySelectorAll('.tab-content-container .tab-content'),
        backButton: document.getElementById('backButton'),
        shareButton: document.getElementById('shareButton'),
        extraPanelContent: document.querySelector('.extra-panel-content'),
        horoscopeTabPanel: document.getElementById('horoscopeTabPanel'),
        statsTabPanel: document.getElementById('statsTabPanel'),
        hiddenGemTabPanel: document.getElementById('hiddenGemTabPanel')
    };

    // --- Application State ---
    const state = {
        currentMagazineData: null,
        allSeriesData: null,
        activeTab: 'contentsTab' // Default active tab (corresponds to data-tab="contentsTab")
    };

    // --- Show/Hide Loading Indicator ---
    function showLoading(show) {
        if (elements.loadingContainer) {
            elements.loadingContainer.classList.toggle('visible', show);
        }
    }

    // --- Populate "Behind the Cover" Panel ---
    async function populateExtraPanel() {
        if (elements.extraPanelContent) {

            const extraPanelData = await fetchData('./data/wsj_trivia.json');

            if (!extraPanelData || extraPanelData.length === 0) {
                elements.extraPanelContent.innerHTML = `<h3>Behind the Cover</h3><p>No extra trivia available at the moment.</p><p><a href="https://www.viz.com/shonenjump" target="_blank" rel="noopener noreferrer">Read the latest chapters on VIZ!</a></p>`;
                return;
            }
            // Select a random entry from extraPanelData
            const randomIndex = Math.floor(Math.random() * extraPanelData.length);
            const randomTrivia = extraPanelData[randomIndex];

            // Format the trivia into HTML
            let triviaHTML = `<h3>${randomTrivia.wsj_trivia_title}</h3>`;
            triviaHTML += `<p>${randomTrivia.wsj_trivia_content}</p>`;

            elements.extraPanelContent.innerHTML = triviaHTML;
        }
    }

    // --- Add Heading to Content (for Contents Tab) ---
    function addHeadingToContent(htmlString, newH2Text) {
        const container = document.createElement('div');
        container.innerHTML = htmlString;
        const firstList = container.querySelectorAll('ul, ol')[0];
        if (!firstList) return htmlString; 

        const prev = firstList.previousElementSibling;
        const newHeading = document.createElement('h2');
        newHeading.textContent = newH2Text;

        if (prev && prev.tagName.toLowerCase().startsWith('h')) { 
            prev.replaceWith(newHeading);
        } else {
            firstList.parentNode.insertBefore(newHeading, firstList);
        }
        return container.innerHTML;
    }

    // --- Helper to get series details from allSeriesData by ID ---
    function getSeriesById(seriesId, allSeriesData) {
        if (!allSeriesData || !seriesId) return null;
        return allSeriesData.find(s => s.id === seriesId);
    }
    
    // --- Populate Trivia Tab ---
    function populateTriviaTab(issueData, allSeriesData) {
        if (!elements.triviaTabContent) return;

        let trivia_html = '<h2>Did you know?</h2>'; // Changed heading
        //trivia_html += '<h3>Trivia about the series in this issue:</h3>';
        let allSeriesTrivia = [];

        // Collect series-specific trivia
        if (issueData && issueData.table_of_contents && allSeriesData) {
            const seriesInIssue = issueData.table_of_contents
                .map(tocEntry => tocEntry.series_id)
                .filter(id => id !== null);
            
            const uniqueSeriesIds = [...new Set(seriesInIssue)];

            uniqueSeriesIds.forEach(seriesId => {
                const series = getSeriesById(seriesId, allSeriesData);
                if (series && series.has_trivia && series.trivia && series.trivia.length > 0) {
                    // Add all trivia for this series, ensuring the series itself isn't "repeated" in terms of selection logic later
                    series.trivia.forEach(item => {
                        allSeriesTrivia.push({ text: item, source: series.title || "A Series", seriesId: series.id });
                    });
                }
            });
        }

        if (allSeriesTrivia.length > 0) {
            // Shuffle the collected trivia
            for (let i = allSeriesTrivia.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allSeriesTrivia[i], allSeriesTrivia[j]] = [allSeriesTrivia[j], allSeriesTrivia[i]];
            }

            // Select up to 8 random trivia items, trying to get diverse series sources
            let selectedTrivia = [];
            const selectedSeriesIds = new Set();
            let count = 0;

            // First pass: try to pick one trivia from unique series
            for (const triviaItem of allSeriesTrivia) {
                if (count < 8 && !selectedSeriesIds.has(triviaItem.seriesId)) {
                    selectedTrivia.push(triviaItem);
                    selectedSeriesIds.add(triviaItem.seriesId);
                    count++;
                }
            }

            // Second pass: if still less than 8, fill with remaining trivia (allows multiple from same series if needed)
            if (count < 8) {
                for (const triviaItem of allSeriesTrivia) {
                    if (count < 8 && !selectedTrivia.includes(triviaItem)) { // Check if item already added
                        // This check might be redundant if shuffle is good, but ensures no exact duplicate objects
                        if (!selectedTrivia.find(st => st.text === triviaItem.text && st.source === triviaItem.source)) {
                             selectedTrivia.push(triviaItem);
                             count++;
                        }
                    }
                    if (count >= 8) break;
                }
            }
            // Ensure we don't exceed 8 items due to the second pass logic
            selectedTrivia = selectedTrivia.slice(0, 8);


            trivia_html += '<ul class="list-disc list-inside pl-4 mt-2">';
            selectedTrivia.forEach(item => {
                trivia_html += `<li>${item.text}</li>`;
            });
            trivia_html += '</ul>';
        } else {
            trivia_html += "<p>No trivia available for series in this issue.</p>";
        }
        elements.triviaTabContent.innerHTML = trivia_html;
    }

    // --- Populate Stats Tab ---
    function populateStatsTab(issueData, allSeriesData) {
        if (!elements.statsTabPanel) return;
        if (!issueData || !issueData.table_of_contents || !allSeriesData) {
            elements.statsTabPanel.innerHTML = '<h2>Stats</h2><p>Statistics are currently unavailable for this issue.</p>';
            return;
        }

        let statsHTML = '<h2>Issue Statistics</h2>';

        // --- Top Three Series (from Table of Contents) ---
        statsHTML += '<h3>Top Series in this Issue:</h3>'; // Removed "(as listed in ToC)"
        const tocSeries = issueData.table_of_contents;
        if (tocSeries && tocSeries.length > 0) {
            statsHTML += '<ol class="list-decimal list-inside pl-4">';
            tocSeries.slice(0, 3).forEach(tocEntry => {
                let seriesTitle = tocEntry.title; // Default to ToC title
                // Removed fetching and displaying votes/rating for top series
                statsHTML += `<li><strong>${seriesTitle}</strong></li>`;
            });
            statsHTML += '</ol>';
        } else {
            statsHTML += '<p>Table of Contents data is not available for this issue.</p>';
        }
        statsHTML += '<hr class="my-3 border-gray-300">';

        // --- Most Recurring Categories with Chart ---
        statsHTML += '<h3>Most commonly associated tags in this issue:</h3>'; // Changed heading
        const seriesInIssueDetails = issueData.table_of_contents
            .filter(toc => toc.series_id !== null)
            .map(toc => getSeriesById(toc.series_id, allSeriesData))
            .filter(series => series !== null);

        if (seriesInIssueDetails.length > 0) {
            const categoryCounts = {};
            seriesInIssueDetails.forEach(s => {
                // Only consider 'categories'
                (s.categories || []).forEach(tag => {
                    categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
                });
            });

            const sortedCategories = Object.entries(categoryCounts)
                .sort(([,a],[,b]) => b-a)
                .slice(0, 5); // Take top 5 for the chart

            if (sortedCategories.length > 0) {
                statsHTML += '<div style="max-width: 400px; margin: 10px auto;"><canvas id="tagChart"></canvas></div>'; // Changed id to tagChart
                statsHTML += '<ul class="list-disc list-inside pl-4 mt-2">';
                 Object.entries(categoryCounts).sort(([,a],[,b]) => b-a).slice(0,5).forEach(([category, count]) => {
                    statsHTML += `<li>${category} (appears in ${count} series)</li>`;
                });
                statsHTML += '</ul>';

            } else {
                statsHTML += '<p>No category data available for series in this issue.</p>';
            }
        } else {
             statsHTML += '<p>No series data found to generate category stats for this issue.</p>';
        }
        
        elements.statsTabPanel.innerHTML = statsHTML;

        if (state.genreChartInstance) { // Use the correct chart instance name
            state.genreChartInstance.destroy();
            state.genreChartInstance = null;
        }

        const tagChartCanvas = document.getElementById('tagChart'); // Use new id
        if (tagChartCanvas && seriesInIssueDetails.length > 0) {
            const categoryCounts = {}; // Recalculate for chart, focusing only on categories
            seriesInIssueDetails.forEach(s => {
                (s.categories || []).forEach(tag => {
                    categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
                });
            });
            const sortedCategoriesForChart = Object.entries(categoryCounts)
                .sort(([,a],[,b]) => b-a)
                .slice(0, 5); 

            if (sortedCategoriesForChart.length > 0) {
                const chartLabels = sortedCategoriesForChart.map(item => item[0]);
                const chartData = sortedCategoriesForChart.map(item => item[1]);

                try {
                     state.genreChartInstance = new Chart(tagChartCanvas, { // Use new canvas id
                        type: 'bar',
                        data: {
                            labels: chartLabels,
                            datasets: [{
                                label: 'Frequency in Issue',
                                data: chartData,
                                backgroundColor: [ 
                                    'rgba(255, 99, 132, 0.7)',
                                    'rgba(54, 162, 235, 0.7)',
                                    'rgba(255, 206, 86, 0.7)',
                                    'rgba(75, 192, 192, 0.7)',
                                    'rgba(153, 102, 255, 0.7)'
                                ],
                                borderColor: [
                                    'rgba(255, 99, 132, 1)',
                                    'rgba(54, 162, 235, 1)',
                                    'rgba(255, 206, 86, 1)',
                                    'rgba(75, 192, 192, 1)',
                                    'rgba(153, 102, 255, 1)'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true, 
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1 
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: false 
                                },
                                title: {
                                    display: true,
                                    text: 'Top 5 Associated Tags' // Updated chart title
                                }
                            }
                        }
                    });
                } catch (e) {
                    console.error("Chart.js error:", e);
                    tagChartCanvas.outerHTML = "<p class='text-red-500 text-center'>Error loading chart. Is Chart.js included?</p>";
                }
            }
        }
    }

    // --- Populate Hidden Gem Tab ---
    function populateHiddenGemTab(issueData, allSeriesData) {
        if (!elements.hiddenGemTabPanel) return;
        if (!issueData || !issueData.table_of_contents || !allSeriesData) {
            elements.hiddenGemTabPanel.innerHTML = "<h2>This issue's Hidden Gem</h2><p>Hidden Gem information is currently unavailable for this issue.</p>"; // Changed heading
            return;
        }

        const seriesInIssueDetails = issueData.table_of_contents
            .filter(toc => toc.series_id !== null)
            .map(toc => getSeriesById(toc.series_id, allSeriesData))
            .filter(series => series !== null && typeof series.mu_votes === 'number' && series.mu_votes > 0);

        if (seriesInIssueDetails.length === 0) {
            elements.hiddenGemTabPanel.innerHTML = "<h2>This issue's Hidden Gem</h2><p>No series with vote data found to determine a hidden gem for this issue.</p>"; // Changed heading
            return;
        }
        
        seriesInIssueDetails.sort((a, b) => {
            if (a.mu_votes !== b.mu_votes) {
                return a.mu_votes - b.mu_votes;
            }
            return (b.mu_rating || 0) - (a.mu_rating || 0); 
        });

        const hiddenGem = seriesInIssueDetails[0];
        let gemHTML = `<h2>This issue's Hidden Gem</h2>`; // Changed heading
        if (hiddenGem) {
            // Flex container for image and text
            gemHTML += `<div class="gem-details my-2 p-3 border border-gray-300 rounded-lg shadow flex flex-col sm:flex-row items-center sm:items-start">`;
            // Image
            if (hiddenGem.mu_image_url) {
                gemHTML += `<img src="${hiddenGem.mu_image_url}" alt="Cover for ${hiddenGem.title}" 
                                 class="w-24 h-32 sm:w-32 sm:h-48 object-cover rounded-md mr-0 mb-3 sm:mr-4 sm:mb-0 border border-gray-400"
                                 onerror="this.onerror=null; this.src='https://placehold.co/100x150/eeeeee/cc0000?text=No+Image'; this.alt='Error loading image';">`;
            } else {
                 gemHTML += `<img src="https://placehold.co/100x150/eeeeee/333333?text=No+Image" alt="Placeholder for ${hiddenGem.title}" 
                                 class="w-24 h-32 sm:w-32 sm:h-48 object-cover rounded-md mr-0 mb-3 sm:mr-4 sm:mb-0 border border-gray-400">`;
            }
            // Text content
            gemHTML += `<div class="flex-grow text-center sm:text-left">`;
            gemHTML += `<h3><strong>${hiddenGem.title}</strong></h3>`;
            // Removed MangaUpdates Votes and Rating
            if (hiddenGem.genres && hiddenGem.genres.length > 0) {
                 gemHTML += `<p><strong>Genres:</strong> ${hiddenGem.genres.join(', ')}</p>`;
            }
            if (hiddenGem.mu_description) {
                gemHTML += `<p class="mt-1 text-sm"><em>${hiddenGem.mu_description.substring(0, 250)}${hiddenGem.mu_description.length > 250 ? '...' : ''}</em></p>`;
            }
            if(hiddenGem.mu_url){
                gemHTML += `<p class="mt-2"><a href="${hiddenGem.mu_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">More info on MangaUpdates</a></p>`;
            }
            gemHTML += `</div>`; // Close text content div
            gemHTML += `</div>`; // Close flex container
        } else {
            gemHTML += `<p>Could not determine a hidden gem for this issue based on available data.</p>`;
        }
        elements.hiddenGemTabPanel.innerHTML = gemHTML;
    }

    // --- Populate Results Page ---
    function populateResultsPage(issueData, allSeriesData) { // Added allSeriesData
        if (!issueData) {
            // ... (existing no data handling) ...
            if (elements.magazineCover) {
                elements.magazineCover.src = 'https://placehold.co/300x420/eeeeee/cc0000?text=No+Data+Found';
                elements.magazineCover.alt = 'No data found for this date';
            }
            if (elements.issueNumber) elements.issueNumber.textContent = 'N/A';
            if (elements.coverDate) elements.coverDate.textContent = 'No data available for the selected birth date.';
            if (elements.contentsTabContent) elements.contentsTabContent.innerHTML = '<p>Sorry, no information found for the selected date. Perhaps it was a week Jump was not published, or our records for this specific date are incomplete.</p>';
            if (elements.factsTabContent) elements.factsTabContent.innerHTML = '<h2>Interesting Facts</h2><p>No facts available.</p>';
            
            // Call new tab population functions even if issueData is null, they handle it
            populateTriviaTab(null, allSeriesData);
            populateStatsTab(null, allSeriesData);
            populateHiddenGemTab(null, allSeriesData);
            if (elements.horoscopeTabPanel) elements.horoscopeTabPanel.innerHTML = '<h2>Horoscope</h2><p>Horoscope data is loading or unavailable.</p>';

            populateExtraPanel();
            umami.track('[RESULTS PAGE] Got an error', { 'error': "WSJ Data for this date not found or incomplete.", 'date': getDateFromURL() });
            return;
        }

        state.currentMagazineData = issueData; // issueData is the specific magazine for the date

        if (elements.magazineCover) {
            elements.magazineCover.src = issueData.cover_image;
            elements.magazineCover.alt = `Cover of Shonen Jump Issue #${issueData.issue_number}`;
            elements.magazineCover.onerror = function () {
                this.onerror = null;
                this.src = 'https://placehold.co/300x420/eeeeee/cc0000?text=Cover+Error';
                this.alt = 'Error loading cover image';
            };
        }

        if (elements.issueNumber) elements.issueNumber.textContent = issueData.issue_number;

        if (elements.coverDate) {
            const dateObj = new Date(issueData.cover_date + 'T00:00:00'); 
            elements.coverDate.textContent = dateObj.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        }
        
        if (elements.contentsTabContent) {
            let contentsHTML = '<h2>Table of Contents (TOC)</h2>';
            if (issueData.table_of_contents && issueData.table_of_contents.length > 0) {
                contentsHTML += '<ul class="list-disc list-inside pl-4 mt-2">'; // Added some basic styling classes
                issueData.table_of_contents.forEach(item => {
                    // Attempt to get full series title from allSeriesData if series_id exists
                    let displayTitle = item.title; // Default to the title from ToC
                    // The user's example shows titles like "Majin Tantei Nōgami Neuro Ch. 1"
                    // which already include chapter numbers. So, directly using item.title is appropriate.
                    // If you wanted to link to a series page or show the canonical series title from wsj_series.json,
                    // you could use getSeriesById(item.series_id, allSeriesData) here.
                    contentsHTML += `<li>${displayTitle}</li>`;
                });
                contentsHTML += '</ul>';
            } else {
                contentsHTML += '<p>Contents for this issue are not available.</p>';
            }
            elements.contentsTabContent.innerHTML = contentsHTML;
        }
        
        // Populate Facts Tab
        if (elements.factsTabContent) elements.factsTabContent.innerHTML = issueData.facts_html || "<h2>Interesting Facts</h2><p>Interesting facts for this issue are not available.</p>";
        
        // Populate new/updated tabs
        populateTriviaTab(issueData, allSeriesData);
        populateStatsTab(issueData, allSeriesData);
        populateHiddenGemTab(issueData, allSeriesData);
        // Horoscope is populated by its own function later in initializePage

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
     * Fetches data from a JSON file.
     * @param {string} filePath - The path to the JSON file.
     * @returns {Promise<Array<Object>>} A promise that resolves with the array of data.
     */
    async function fetchData(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                umami.track('[RESULTS PAGE] Got an error', { 'error': `HTTP error! status: ${response.status}`, 'filePath': filePath });
                throw new Error(`HTTP error! status: ${response.status} while fetching ${filePath}`);
            }
            const data = await response.json();

            return data;
        } catch (error) {
            umami.track('[RESULTS PAGE] Got an error', { 'error': `Failed to fetch data: ${error.message}`, 'filePath': filePath });
            console.error("Failed to fetch data:", error);
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
        let defaultDescription = "Enter a date to find the Shonen Jump from that day!";
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

    /**
     * Determines the astrological sign based on a birth date.
     * @param {string} birthDateString - The birth date in 'YYYY-MM-DD' format.
     * @param {Array<Object>} horoscopes - Array of horoscope objects from wsj_horoscope.json.
     * @returns {Object|null} The horoscope object for the determined sign, or null if not found or invalid date.
     */
    function getHoroscopeSign(birthDateString, horoscopes) {
        if (!birthDateString || !horoscopes || horoscopes.length === 0) {
            return null;
        }

        try {
            const birthDate = new Date(birthDateString + 'T00:00:00'); // Ensure consistent parsing
            const birthMonth = birthDate.getMonth() + 1; // JavaScript months are 0-indexed
            const birthDay = birthDate.getDate();

            for (const sign of horoscopes) {
                const [startMonth, startDay] = sign.date_start.split('-').map(Number);
                const [endMonth, endDay] = sign.date_end.split('-').map(Number);

                if (startMonth <= endMonth) { // Sign does not span across year-end (e.g., Aries: Mar 21 - Apr 19)
                    if (birthMonth === startMonth && birthDay >= startDay) {
                        return sign;
                    }
                    if (birthMonth === endMonth && birthDay <= endDay) {
                        return sign;
                    }
                    if (birthMonth > startMonth && birthMonth < endMonth) {
                        return sign;
                    }
                } else { // Sign spans across year-end (e.g., Capricorn: Dec 22 - Jan 19)
                    if (birthMonth === startMonth && birthDay >= startDay) {
                        return sign; // e.g., Born in December, after startDay
                    }
                    if (birthMonth === endMonth && birthDay <= endDay) {
                        return sign; // e.g., Born in January, before endDay
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing birth date for horoscope:", e);
            return null;
        }
        return null; // No sign found
    }

    /**
     * Fetches and displays the horoscope data.
     * @param {string|null} birthDateString - The birth date from URL (YYYY-MM-DD).
     */
    async function displayHoroscope(birthDateString) {
        if (!elements.horoscopeTabPanel) return; // Tab panel not found

        if (!birthDateString) {
            elements.horoscopeTabPanel.innerHTML = '<h2>Shonen Horoscope</h2><p>Please provide a birth date to see your Shonen Horoscope.</p>';
            return;
        }

        const horoscopeData = await fetchData('./data/wsj_horoscope.json');
        if (!horoscopeData) {
            elements.horoscopeTabPanel.innerHTML = '<h2>Shonen Horoscope</h2><p>Could not load horoscope data. Please try again later.</p>';
            return;
        }

        const userSign = getHoroscopeSign(birthDateString, horoscopeData);

        if (userSign) {
            let html = `<h2>Shonen Horoscope</h2>`;
            html += `<div class="horoscope-details" style="border-left: 6px solid ${userSign.hex_color || '#cccccc'}; padding-left: 15px; margin-top:10px;">`;
            html += `<img src="${userSign.image_url || 'https://placehold.co/100x100/eeeeee/333333?text=No+Image'}" 
                         alt="${userSign.character_name || 'Character Image'}" 
                         style="max-width: 100px; width:30%; max-height:120px; object-fit:cover; float: right; margin-left: 15px; margin-bottom:10px; border: 2px solid ${userSign.hex_color || '#333333'}; border-radius: 8px;"
                         onerror="this.onerror=null; this.src='https://placehold.co/100x100/eeeeee/cc0000?text=Img+Error';">`;
            html += `<h3>${userSign.horoscope_name || 'N/A'} (${userSign.correspondent_sign_name || 'N/A'})</h3>`;
            html += `<p style="margin-bottom: 5px;"><strong>Archetype:</strong> ${userSign.shonen_archetype || 'N/A'}</p>`;
            html += `<p style="margin-bottom: 5px;"><strong>Character:</strong> ${userSign.character_name || 'N/A'} <em>(${userSign.series || 'N/A'} - ${userSign.era || 'N/A'})</em></p>`;
            html += `<p style="clear:right; margin-bottom: 8px;"><em>${userSign.description || 'No description available.'}</em></p>`;
            html += `<p><strong>Power Type:</strong> ${userSign.shonen_power_type || 'N/A'}</p>`;
            html += `</div>`;
            elements.horoscopeTabPanel.innerHTML = html;
        } else {
            elements.horoscopeTabPanel.innerHTML = '<h2>Shonen Horoscope</h2><p>Could not determine your Shonen Horoscope for the selected date. It might be on the cusp or data is unavailable.</p>';
        }
    }

    // --- Initial Load ---
    async function initializePage() {
        showLoading(true);

        const birthDateFromURL = getDateFromURL();

        // Fetch all series data once
        state.allSeriesData = await fetchData('./data/wsj_series.json'); 

        if (!birthDateFromURL) {
            umami.track('[RESULTS PAGE] No date provided in URL');
            console.warn("No date provided in URL");
            populateResultsPage(null);
            await displayHoroscope(null);
            addCustomDescriptions(null);
            showLoading(false);
            return;
        }

        umami.track(props => ({ ...props, date: birthDateFromURL }));
        umami.identify({ date: birthDateFromURL });

        setTimeout(async () => {
            const allWSJIssues = await fetchData('./data/wsj_issues.json');

            const birthdateMagazine = findMagazineForDate(allWSJIssues, birthDateFromURL);

            if (birthdateMagazine) {
                umami.track('[RESULTS PAGE] WSJ Data loaded', { 'cover_date': birthdateMagazine.cover_date, 'issue_number': birthdateMagazine.issue_number });
                console.log("Found magazine data:", birthdateMagazine);
            } else {
                umami.track('[RESULTS PAGE] Got an error', { 'error': 'No WSJ data found for this date.', 'date': birthDateFromURL });
                console.log("No specific magazine data found for the date.");
            }

            populateResultsPage(birthdateMagazine, state.allSeriesData);
            await displayHoroscope(birthDateFromURL);
            addCustomDescriptions(birthDateFromURL);

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
