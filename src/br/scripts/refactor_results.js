// js/results-app.js
(function() {
    'use strict';

    // --- Application Configuration ---
    const CONFIG = {
        dataPaths: {
            issues: './data/wsj_issues.json',
            series: './data/wsj_series.json',
            trivia: './data/wsj_trivia.json',
            horoscope: './data/wsj_horoscope.json',
        },
        placeholders: {
            coverError: 'https://placehold.co/300x420/eeeeee/cc0000?text=Error+Loading+Cover',
            coverNoData: 'https://placehold.co/300x420/eeeeee/cc0000?text=No+Cover+Found',
            horoscopeImageError: 'https://placehold.co/100x100/eeeeee/333333?text=Image+Error',
        },
        maxTriviaItems: 8,
        topSeriesCount: 3,
        topTagsCount: 5, // For chart
        topTagsListCount: 10, // For list display
        hiddenGemDescriptionLength: 250,
        initialLoadDelay: 500, // Reduced delay, original was 1200ms
    };

    // --- DOM Element References ---
    const elements = {
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
        // Dynamic elements will be queried when needed or passed to functions
    };

    // --- Application State ---
    const state = {
        currentMagazineData: null,
        allSeriesData: null,
        activeTabId: 'contentsTabPanel', // Default active tab content ID
        genreChartInstance: null,
        birthDateFromURL: null,
    };

    // --- Utility Functions ---
    const Utils = {
        showLoading: function(show) {
            elements.loadingContainer?.classList.toggle('visible', show);
        },
        fetchData: async function(filePath) {
            try {
                const response = await fetch(filePath);
                if (!response.ok) {
                    console.error(`HTTP error! status: ${response.status} while fetching ${filePath}`);
                    ErrorHandler.track('[RESULTS PAGE] API Error', { error: `HTTP ${response.status}`, filePath });
                    return null;
                }
                return await response.json();
            } catch (error) {
                console.error(`Failed to fetch data from ${filePath}:`, error);
                ErrorHandler.track('[RESULTS PAGE] Fetch Error', { error: error.message, filePath });
                return null;
            }
        },
        getDateFromURL: function() {
            const params = new URLSearchParams(window.location.search);
            return params.get('date');
        },
        findMagazineForDate: function(magazines, targetDateString) {
            if (!targetDateString || !magazines || magazines.length === 0) return null;
            const targetDate = new Date(targetDateString + 'T00:00:00Z'); // Ensure UTC context
            return magazines
                .filter(magazine => new Date(magazine.cover_date + 'T00:00:00Z') <= targetDate)
                .sort((a, b) => new Date(b.cover_date + 'T00:00:00Z') - new Date(a.cover_date + 'T00:00:00Z'))[0] || null;
        },
        getSeriesById: function(seriesId) {
            if (!state.allSeriesData || !seriesId) return null;
            return state.allSeriesData.find(s => String(s.id) === String(seriesId));
        },
        formatDateDisplay: function(dateString) {
            if (!dateString) return 'N/A';
            const dateObj = new Date(dateString + 'T00:00:00Z'); // Ensure UTC context
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
            });
        },
        truncateText: function(text, maxLength) {
            if (!text) return '';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        }
    };

    // --- Analytics & Error Tracking ---
    const ErrorHandler = {
        track: function(eventName, eventData = {}) {
            if (typeof umami !== 'undefined') {
                umami.track(eventName, eventData);
            } else {
                // console.log(`Analytics (umami not found): ${eventName}`, eventData);
            }
        },
        logError: function(message, errorObject = {}) {
            console.error(message, errorObject);
            this.track('[RESULTS PAGE] Client Error', { 
                errorMessage: message, 
                details: JSON.stringify(errorObject) 
            });
        }
    };

    // --- UI Update Functions ---
    const UIUpdaters = {
        populateExtraPanel: async function() {
            if (!elements.extraPanelContent) return;

            const extraPanelData = await Utils.fetchData(CONFIG.dataPaths.trivia);
            let html = `<h3 class="sub-heading">Behind the Cover</h3>`;
            if (!extraPanelData || extraPanelData.length === 0) {
                html += `
                    <p class="text-muted">No extra trivia available at the moment.</p>
                    <p>
                        <a href="https://www.viz.com/shonenjump" target="_blank" rel="noopener noreferrer">
                            Read the latest chapters on VIZ!
                        </a>
                    </p>`;
            } else {
                const randomTrivia = extraPanelData[Math.floor(Math.random() * extraPanelData.length)];
                html += `
                    <h4 class="font-bold">${randomTrivia.wsj_trivia_title}</h4>
                    <p>${randomTrivia.wsj_trivia_content}</p>`;
            }
            elements.extraPanelContent.innerHTML = html;
        },

        populateTriviaTab: function(issueData) {
            if (!elements.triviaTabPanel) {
                ErrorHandler.logError("Trivia tab panel element not found.");
                return;
            }

            let triviaHTML = `<h2 class="tab-section-title">Trivia: Series in this Issue</h2>`;
            if (!issueData?.table_of_contents || !state.allSeriesData) {
                triviaHTML += `<p class="text-muted">No trivia available for series in this issue.</p>`;
                elements.triviaTabPanel.innerHTML = triviaHTML;
                return;
            }

            const seriesInIssueIds = [...new Set(
                issueData.table_of_contents
                    .map(tocEntry => tocEntry.series_id)
                    .filter(id => id !== null)
            )];

            let allSeriesTrivia = [];
            seriesInIssueIds.forEach(seriesId => {
                const series = Utils.getSeriesById(seriesId);
                if (series?.has_trivia && series.trivia?.length > 0) {
                    series.trivia.forEach(item => {
                        let parsedItemText = typeof item === 'string' ? item : String(item);
                        if (typeof series.title === 'string' && parsedItemText.includes(series.title)) {
                            const parts = parsedItemText.split(series.title);
                            parsedItemText = `<strong class="list-item-title">${series.title}</strong> ${parts.slice(1).join(series.title).trim() || parsedItemText.trim()}`;
                        } else if (typeof series.title === 'string') {
                            parsedItemText = `<strong class="list-item-title">${series.title}:</strong> ${parsedItemText}`;
                        }
                        allSeriesTrivia.push({
                            text: parsedItemText,
                            source: series.title || "A Series",
                            seriesId: series.id
                        });
                    });
                }
            });

            if (allSeriesTrivia.length > 0) {
                allSeriesTrivia.sort(() => 0.5 - Math.random()); // Shuffle

                let selectedTrivia = [];
                const selectedSeriesIds = new Set();
                let count = 0;

                for (const triviaItem of allSeriesTrivia) {
                    if (count < CONFIG.maxTriviaItems && !selectedSeriesIds.has(triviaItem.seriesId)) {
                        selectedTrivia.push(triviaItem);
                        selectedSeriesIds.add(triviaItem.seriesId);
                        count++;
                    }
                }
                if (count < CONFIG.maxTriviaItems) {
                    for (const triviaItem of allSeriesTrivia) {
                        if (count >= CONFIG.maxTriviaItems) break;
                        if (!selectedTrivia.some(st => st.text === triviaItem.text && st.source === triviaItem.source)) {
                            selectedTrivia.push(triviaItem);
                            count++;
                        }
                    }
                }
                selectedTrivia = selectedTrivia.slice(0, CONFIG.maxTriviaItems);

                const alternatingIcons = ["fa-comment-dots", "fa-lightbulb"];
                triviaHTML += '<ul class="content-list">';
                selectedTrivia.forEach((item, index) => {
                    const iconClass = alternatingIcons[index % alternatingIcons.length];
                    triviaHTML += `
                        <li>
                            <span class="list-icon"><i class="fas ${iconClass}"></i></span>
                            <div>${item.text}</div>
                        </li>`;
                });
                triviaHTML += '</ul>';
            } else {
                triviaHTML += `<p class="text-muted">No trivia facts found for the series in this issue.</p>`;
            }
            elements.triviaTabPanel.innerHTML = triviaHTML;
        },

        populateStatsTab: function(issueData) {
            if (!elements.statsTabPanel) {
                ErrorHandler.logError("Stats tab panel element not found.");
                return;
            }
            let statsHTML = `<h2 class="tab-section-title">Issue Statistics</h2>`;

            if (!issueData?.table_of_contents || !state.allSeriesData) {
                statsHTML += `<p class="text-muted">Statistics are currently unavailable for this issue.</p>`;
                elements.statsTabPanel.innerHTML = statsHTML;
                return;
            }

            // Top Series
            statsHTML += `<div class="stats-section"><h3 class="sub-heading">Top Series in this Issue:</h3>`;
            const tocSeries = issueData.table_of_contents;
            const rankingIcons = ['gold', 'silver', 'bronze'];

            if (tocSeries?.length > 0) {
                statsHTML += '<ol class="stats-ranking-list">';
                tocSeries.slice(0, CONFIG.topSeriesCount).forEach((tocEntry, index) => {
                    const series = Utils.getSeriesById(tocEntry.series_id);
                    const iconClass = rankingIcons[index] ? `fas fa-trophy ${rankingIcons[index]}` : 'fas fa-star';
                    let muLinkHTML = '';
                    if (series?.mu_url) {
                        muLinkHTML = `
                            <a href="${series.mu_url}" target="_blank" rel="noopener noreferrer" 
                               class="stats-mu-link" title="View on MangaUpdates">
                                <i class="fas fa-link"></i>
                            </a>`;
                    }
                    statsHTML += `
                        <li>
                            <span class="stats-ranking-icon"><i class="${iconClass}"></i></span> 
                            <div class="flex-grow-1">
                                <span class="stats-ranking-title">${tocEntry.title}</span>${muLinkHTML}
                            </div>
                        </li>`;
                });
                statsHTML += '</ol></div>';
            } else {
                statsHTML += `<p class="text-muted">Table of Contents data is not available.</p></div>`;
            }
            
            statsHTML += '<hr class="separator">';

            // Most Recurring Tags/Categories
            statsHTML += `<div class="stats-section"><h3 class="sub-heading">Most Common Tags:</h3>`;
            const seriesInIssueDetails = issueData.table_of_contents
                .filter(toc => toc.series_id !== null)
                .map(toc => Utils.getSeriesById(toc.series_id))
                .filter(series => series !== null);

            if (seriesInIssueDetails.length > 0) {
                const categoryCounts = seriesInIssueDetails.reduce((acc, s) => {
                    (s.categories || []).forEach(tag => acc[tag] = (acc[tag] || 0) + 1);
                    return acc;
                }, {});

                // Merge "Adapted to..." categories
                const mergedCategoryCounts = {};
                let adaptedToMediaCount = 0;
                const mergePrefix = "Adapted to";
                for (const category in categoryCounts) {
                    if (category.startsWith(mergePrefix)) {
                        adaptedToMediaCount += categoryCounts[category];
                    } else {
                        mergedCategoryCounts[category] = categoryCounts[category];
                    }
                }
                if (adaptedToMediaCount > 0) {
                    mergedCategoryCounts["Adapted to other media"] = adaptedToMediaCount;
                }

                const sortedCategories = Object.entries(mergedCategoryCounts)
                    .sort(([, a], [, b]) => b - a);

                if (sortedCategories.length > 0) {
                    statsHTML += `<div class="tag-chart-container"><canvas id="tagChart"></canvas></div>`;
                    statsHTML += '<ul class="content-list">';
                    sortedCategories.slice(0, CONFIG.topTagsListCount).forEach(([category, count]) => {
                        statsHTML += `
                            <li>
                                <span class="list-icon"><i class="fas fa-chevron-right"></i></span>
                                <div>
                                    <span class="list-item-title">${category}</span> 
                                    <span class="list-item-meta">(in ${count} series)</span>
                                </div>
                            </li>`;
                    });
                    statsHTML += '</ul>';
                } else {
                    statsHTML += `<p class="text-muted">No category data after processing.</p>`;
                }
            } else {
                statsHTML += `<p class="text-muted">No series data for category stats.</p>`;
            }
            statsHTML += `</div>`;
            elements.statsTabPanel.innerHTML = statsHTML;
            this.renderTagChart(seriesInIssueDetails); // Render chart after HTML is in DOM
        },

        renderTagChart: function(seriesInIssueDetails) {
            if (state.genreChartInstance) {
                state.genreChartInstance.destroy();
                state.genreChartInstance = null;
            }
            const tagChartCanvas = document.getElementById('tagChart');
            if (!tagChartCanvas || !seriesInIssueDetails || seriesInIssueDetails.length === 0 || typeof Chart === 'undefined') {
                if (tagChartCanvas) tagChartCanvas.innerHTML = `<p class="text-error text-center">Chart library not loaded or no data.</p>`;
                return;
            }

            const categoryCounts = seriesInIssueDetails.reduce((acc, s) => {
                (s.categories || []).forEach(tag => acc[tag] = (acc[tag] || 0) + 1);
                return acc;
            }, {});
             // Merge "Adapted to..." categories for chart as well
            const mergedCategoryCounts = {};
            let adaptedToMediaCount = 0;
            const mergePrefix = "Adapted to";
            for (const category in categoryCounts) {
                if (category.startsWith(mergePrefix)) {
                    adaptedToMediaCount += categoryCounts[category];
                } else {
                    mergedCategoryCounts[category] = categoryCounts[category];
                }
            }
            if (adaptedToMediaCount > 0) {
                mergedCategoryCounts["Adapted to other media"] = adaptedToMediaCount;
            }


            const sortedCategoriesForChart = Object.entries(mergedCategoryCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, CONFIG.topTagsCount);

            if (sortedCategoriesForChart.length > 0) {
                const chartLabels = sortedCategoriesForChart.map(item => item[0]);
                const chartData = sortedCategoriesForChart.map(item => item[1]);
                try {
                    state.genreChartInstance = new Chart(tagChartCanvas, {
                        type: 'bar',
                        data: {
                            labels: chartLabels,
                            datasets: [{
                                label: 'Frequency in Issue',
                                data: chartData,
                                backgroundColor: [ // Use CSS variables or a predefined palette
                                    'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)',
                                    'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)',
                                    'rgba(153, 102, 255, 0.7)'
                                ],
                                borderColor: [
                                    'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)',
                                    'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)',
                                    'rgba(153, 102, 255, 1)'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false, // Allow chart to fill container better
                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                            plugins: {
                                legend: { display: false },
                                title: { display: true, text: `Top ${CONFIG.topTagsCount} Associated Tags` }
                            }
                        }
                    });
                } catch (e) {
                    ErrorHandler.logError("Chart.js error", e);
                    tagChartCanvas.outerHTML = `<p class="text-error text-center">Error loading chart.</p>`;
                }
            } else {
                 if (tagChartCanvas.parentNode) tagChartCanvas.parentNode.innerHTML = `<p class="text-muted text-center">Not enough tag data for a chart.</p>`;
            }
        },

        populateHiddenGemTab: function(issueData) {
            if (!elements.hiddenGemTabPanel) {
                ErrorHandler.logError("Hidden Gem tab panel element not found.");
                return;
            }
            let gemHTML = `<h2 class="tab-section-title">This Issue's Hidden Gem</h2>`;

            if (!issueData?.table_of_contents || !state.allSeriesData) {
                gemHTML += `<p class="text-muted">Hidden Gem information is currently unavailable.</p>`;
                elements.hiddenGemTabPanel.innerHTML = gemHTML;
                return;
            }

            const seriesInIssueDetails = issueData.table_of_contents
                .map(toc => Utils.getSeriesById(toc.series_id))
                .filter(series => series && typeof series.mu_votes === 'number' && series.mu_votes > 0);

            if (seriesInIssueDetails.length === 0) {
                gemHTML += `<p class="text-muted">No series with vote data found to determine a hidden gem.</p>`;
                elements.hiddenGemTabPanel.innerHTML = gemHTML;
                return;
            }

            seriesInIssueDetails.sort((a, b) => {
                if (a.mu_votes !== b.mu_votes) return a.mu_votes - b.mu_votes;
                return (b.mu_rating || 0) - (a.mu_rating || 0);
            });
            const hiddenGem = seriesInIssueDetails[0];

            if (hiddenGem) {
                gemHTML += `
                    <div class="hidden-gem-container">
                        <img src="${hiddenGem.mu_image_url || CONFIG.placeholders.coverNoData}" 
                             alt="Cover for ${hiddenGem.title || 'N/A'}" 
                             class="hidden-gem-image"
                             onerror="this.onerror=null; this.src='${CONFIG.placeholders.coverError}'; this.alt='Error loading image';">
                        <div class="hidden-gem-content">
                            <h3 class="hidden-gem-title">${hiddenGem.title || 'Untitled Series'}</h3>
                            ${hiddenGem.author ? `<p class="hidden-gem-meta"><strong>Author:</strong> ${hiddenGem.author}</p>` : ''}
                            ${hiddenGem.genres?.length > 0 ? `<p class="hidden-gem-meta"><strong>Genres:</strong> ${hiddenGem.genres.join(', ')}</p>` : ''}
                            ${hiddenGem.mu_description ? `<p class="hidden-gem-description">${Utils.truncateText(hiddenGem.mu_description, CONFIG.hiddenGemDescriptionLength)}</p>` : ''}
                            ${hiddenGem.mu_url ? `<p><a href="${hiddenGem.mu_url}" target="_blank" rel="noopener noreferrer" class="hidden-gem-link">More info on MangaUpdates</a></p>` : ''}
                        </div>
                    </div>`;
            } else {
                gemHTML += `<p class="text-muted">Could not determine a hidden gem for this issue.</p>`;
            }
            elements.hiddenGemTabPanel.innerHTML = gemHTML;
        },

        getHoroscopeSign: function(birthDateString, horoscopes) {
            if (!birthDateString || !horoscopes?.length) return null;
            try {
                const birthDate = new Date(birthDateString + 'T00:00:00Z'); // UTC
                const birthMonth = birthDate.getUTCMonth() + 1;
                const birthDay = birthDate.getUTCDate();

                for (const sign of horoscopes) {
                    const [startMonth, startDay] = sign.date_start.split('-').map(Number);
                    const [endMonth, endDay] = sign.date_end.split('-').map(Number);

                    if ((birthMonth === startMonth && birthDay >= startDay) ||
                        (birthMonth === endMonth && birthDay <= endDay) ||
                        (startMonth < endMonth && birthMonth > startMonth && birthMonth < endMonth) ||
                        (startMonth > endMonth && (birthMonth > startMonth || birthMonth < endMonth))) {
                        return sign;
                    }
                }
            } catch (e) {
                ErrorHandler.logError("Error parsing birth date for horoscope", { error: e.message, date: birthDateString });
                return null;
            }
            return null;
        },

        displayHoroscope: async function(birthDateString) {
            if (!elements.horoscopeTabPanel) return;
            let html = `<h2 class="tab-section-title">Your Shonen Horoscope</h2>`;

            if (!birthDateString) {
                html += `<p class="text-muted">Please provide a birth date to see your Shonen Horoscope.</p>`;
                elements.horoscopeTabPanel.innerHTML = html;
                return;
            }

            const horoscopeData = await Utils.fetchData(CONFIG.dataPaths.horoscope);
            if (!horoscopeData) {
                html += `<p class="text-error">Could not load horoscope data. Please try again later.</p>`;
                elements.horoscopeTabPanel.innerHTML = html;
                return;
            }

            const userSign = this.getHoroscopeSign(birthDateString, horoscopeData);

            if (userSign) {
                const borderColor = userSign.hex_color || '#cccccc';
                html += `
                    <div class="horoscope-details" style="border-left-color: ${borderColor};">
                        <img src="${userSign.image_url || CONFIG.placeholders.horoscopeImageError}" 
                             alt="${userSign.character_name || 'Character Image'}" 
                             class="horoscope-image" style="border-color: ${userSign.hex_color || '#333333'};"
                             onerror="this.onerror=null; this.src='${CONFIG.placeholders.horoscopeImageError}';">
                        <h3>${userSign.horoscope_name || 'N/A'}</h3>
                        <p><strong>Archetype:</strong> ${userSign.shonen_archetype || 'N/A'}</p>
                        <p><strong>Character:</strong> ${userSign.character_name || 'N/A'} <em>(${userSign.series || 'N/A'})</em></p>
                        <p class="text-italic">${userSign.description || 'No description available.'}</p>
                        <p><strong>Power Type:</strong> ${userSign.shonen_power_type || 'N/A'}</p>
                    </div>`;
            } else {
                html += `<p class="text-muted">Could not determine your Shonen Horoscope for the selected date.</p>`;
            }
            elements.horoscopeTabPanel.innerHTML = html;
        },

        updateMetaTags: function() {
            let description = "Enter a date to find the Shonen Jump from that day!";
            let pageTitle = "JumpBack - Find Your Shonen Jump!";

            if (state.birthDateFromURL && state.currentMagazineData) {
                const issueCoverDate = elements.coverDate?.textContent || Utils.formatDateDisplay(state.currentMagazineData.cover_date);
                description = `On my birthdate (${state.birthDateFromURL}), the Shonen Jump issue was #${state.currentMagazineData.issue_number} (cover date: ${issueCoverDate})! Check out JumpBack to find yours!`;
                pageTitle = `JumpBack - Issue #${state.currentMagazineData.issue_number} (${issueCoverDate})`;
            } else if (state.birthDateFromURL) {
                pageTitle = "JumpBack - Issue not found";
                description = `No Shonen Jump issue found for ${state.birthDateFromURL}. Try another date!`;
            }

            document.title = pageTitle;
            document.querySelector('meta[name="description"]')?.setAttribute('content', description);
            document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
            document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
            document.querySelector('meta[property="og:title"]')?.setAttribute('content', pageTitle);
            // Consider setting og:image if magazineCover.src is valid and not a placeholder
            if (elements.magazineCover && elements.magazineCover.src && !elements.magazineCover.src.includes('placehold.co')) {
                 document.querySelector('meta[property="og:image"]')?.setAttribute('content', elements.magazineCover.src);
                 document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', elements.magazineCover.src);
            }
        },

        populateResultsPage: function(issueData) {
            state.currentMagazineData = issueData;

            if (!issueData) {
                elements.magazineCover && (elements.magazineCover.src = CONFIG.placeholders.coverNoData);
                elements.magazineCover && (elements.magazineCover.alt = 'No data found for this date');
                if (elements.issueNumber) elements.issueNumber.textContent = 'N/A';
                if (elements.coverDate) elements.coverDate.textContent = 'No data available for the selected birth date.';
                if (elements.contentsTabPanel) elements.contentsTabPanel.innerHTML = `<p class="placeholder-text">Sorry, no information found for this date. Jump might not have been published, or our records are incomplete.</p>`;
                ErrorHandler.track('[RESULTS PAGE] No Issue Data', { date: state.birthDateFromURL });
            } else {
                if (elements.magazineCover) {
                    elements.magazineCover.src = issueData.cover_image || CONFIG.placeholders.coverNoData;
                    elements.magazineCover.alt = `Cover of Shonen Jump Issue #${issueData.issue_number}`;
                    elements.magazineCover.onerror = function() {
                        this.onerror = null;
                        this.src = CONFIG.placeholders.coverError;
                        this.alt = 'Error loading cover image';
                    };
                }
                if (elements.issueNumber) elements.issueNumber.textContent = issueData.issue_number;
                if (elements.coverDate) elements.coverDate.textContent = Utils.formatDateDisplay(issueData.cover_date);

                if (elements.contentsTabPanel) {
                    let contentsHTML = `<h2 class="tab-section-title">Table of Contents (TOC)</h2>`;
                    if (issueData.table_of_contents?.length > 0) {
                        contentsHTML += '<ul class="content-list">';
                        issueData.table_of_contents.forEach(item => {
                            contentsHTML += `<li><span class="list-icon"><i class="fas fa-book-open"></i></span>${item.title}</li>`;
                        });
                        contentsHTML += '</ul>';
                    } else {
                        contentsHTML += `<p class="text-muted">Contents for this issue are not available.</p>`;
                    }
                    elements.contentsTabPanel.innerHTML = contentsHTML;
                }
            }

            // Populate other tabs
            this.populateTriviaTab(issueData);
            this.populateStatsTab(issueData);
            this.populateHiddenGemTab(issueData);
            // Horoscope is populated separately in initializePage after data fetch
            
            this.populateExtraPanel(); // This fetches its own data
            this.updateMetaTags(); // Update meta tags after data is populated

            // Activate the default or stored active tab
            const tabToActivate = document.querySelector(`.tab-navigation .tab[data-tab="${state.activeTabId.replace('Panel','')}"]`) || elements.tabs[0];
            if (tabToActivate) EventHandlers.handleTabClick(tabToActivate);
        }
    };

    // --- Event Handlers ---
    const EventHandlers = {
        handleTabClick: function(clickedTab) {
            if (!clickedTab || clickedTab.classList.contains('active')) return;

            elements.tabs.forEach(tab => {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
                tab.setAttribute('tabindex', '-1');
            });
            elements.tabContents.forEach(content => {
                content?.classList.remove('active'); // Using active class to show/hide
            });

            clickedTab.classList.add('active');
            clickedTab.setAttribute('aria-selected', 'true');
            clickedTab.setAttribute('tabindex', '0');

            const tabId = clickedTab.dataset.tab;
            state.activeTabId = tabId + "Panel"; 

            const activeContentPanel = document.getElementById(state.activeTabId);
            if (activeContentPanel) {
                activeContentPanel.classList.add('active');
                ErrorHandler.track('[RESULTS PAGE] Tab Clicked', { tab: tabId });
            } else {
                ErrorHandler.logError("Content panel not found for ID: " + state.activeTabId);
            }
        },

        handleTabKeydown: function(e, currentTab) {
            let newTabIndex;
            const tabsArray = Array.from(elements.tabs);
            const currentTabIndex = tabsArray.indexOf(currentTab);

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleTabClick(currentTab);
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                newTabIndex = (currentTabIndex + 1) % tabsArray.length;
                tabsArray[newTabIndex]?.focus();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                newTabIndex = (currentTabIndex - 1 + tabsArray.length) % tabsArray.length;
                tabsArray[newTabIndex]?.focus();
            }
        },

        shareResult: function() {
            if (!state.currentMagazineData) {
                // Replace alert with a more modern notification if possible
                alert("No result loaded to share yet!");
                return;
            }

            const birthDate = state.birthDateFromURL || "your birthdate";
            const issueCoverDate = elements.coverDate?.textContent || Utils.formatDateDisplay(state.currentMagazineData.cover_date);
            const shareText = `On my birthdate (${birthDate}), the Shonen Jump issue was #${state.currentMagazineData.issue_number} (cover date: ${issueCoverDate})! Check out JumpBack to find yours!`;
            const shareUrl = window.location.href;

            if (navigator.share) {
                navigator.share({
                    title: 'My Birth Jump!',
                    text: shareText,
                    url: shareUrl
                })
                .then(() => ErrorHandler.track('[RESULTS PAGE] Shared Result', { date: birthDate, issue: state.currentMagazineData.issue_number, type: 'Native' }))
                .catch((error) => {
                    ErrorHandler.logError('Share failed', error);
                    prompt("Copy this link to share:", `${shareText} ${shareUrl}`);
                });
            } else {
                ErrorHandler.track('[RESULTS PAGE] Shared Result', { date: birthDate, issue: state.currentMagazineData.issue_number, type: 'Prompt' });
                prompt("Copy this link to share:", `${shareText} ${shareUrl}`);
            }
        },

        setupEventListeners: function() {
            elements.tabs.forEach(tab => {
                tab.addEventListener('click', () => this.handleTabClick(tab));
                tab.addEventListener('keydown', (e) => this.handleTabKeydown(e, tab));
            });

            elements.backButton?.addEventListener('click', () => {
                ErrorHandler.track('[RESULTS PAGE] Back Button Clicked');
                window.location.href = 'index.html'; // Assuming index.html is the previous page
            });

            elements.shareButton?.addEventListener('click', this.shareResult);
        }
    };

    // --- Initialization ---
    const App = {
        initialize: async function() {
            Utils.showLoading(true);
            state.birthDateFromURL = Utils.getDateFromURL();

            // Set up analytics early
            if (typeof umami !== 'undefined' && state.birthDateFromURL) {
                umami.track(props => ({ ...props, page: '/results', date: state.birthDateFromURL }));
                umami.identify({ birthDate: state.birthDateFromURL });
            }
            
            // Fetch essential series data first
            state.allSeriesData = await Utils.fetchData(CONFIG.dataPaths.series);
            if (!state.allSeriesData) {
                ErrorHandler.logError("Failed to load essential series data. Some features might be limited.");
                // Display a user-facing error message in the UI if critical
                elements.contentsTabPanel.innerHTML = `<p class="text-error placeholder-text">Could not load essential series data. Please try refreshing.</p>`;
            }

            if (!state.birthDateFromURL) {
                ErrorHandler.logError("No date provided in URL.");
                UIUpdaters.populateResultsPage(null); // Show empty/error state
                await UIUpdaters.displayHoroscope(null); // Handle null date for horoscope
                UIUpdaters.updateMetaTags();
                Utils.showLoading(false);
                return;
            }
            
            // Using a small delay for perceived performance, can be removed if data loads quickly
            // setTimeout(async () => { // Removed original setTimeout, direct execution now
                const allWSJIssues = await Utils.fetchData(CONFIG.dataPaths.issues);
                const birthdateMagazine = allWSJIssues ? Utils.findMagazineForDate(allWSJIssues, state.birthDateFromURL) : null;

                if (birthdateMagazine) {
                    ErrorHandler.track('[RESULTS PAGE] WSJ Data Loaded', { coverDate: birthdateMagazine.cover_date, issue: birthdateMagazine.issue_number });
                } else {
                    ErrorHandler.track('[RESULTS PAGE] No Magazine Data', { date: state.birthDateFromURL });
                    console.log("No specific magazine data found for the date:", state.birthDateFromURL);
                }

                UIUpdaters.populateResultsPage(birthdateMagazine);
                await UIUpdaters.displayHoroscope(state.birthDateFromURL); // Display horoscope after main content
                // Meta tags are updated within populateResultsPage or after horoscope if needed

                Utils.showLoading(false);
            // }, CONFIG.initialLoadDelay); // Removed setTimeout
        },

        start: function() {
            EventHandlers.setupEventListeners();
            this.initialize().catch(error => {
                ErrorHandler.logError("Critical error during page initialization", error);
                Utils.showLoading(false);
                // Display a generic error message on the page
                document.body.innerHTML = `<div class="container" style="padding:20px; text-align:center;">
                                               <h1 style="color:var(--error-color);">Oops! Something went wrong.</h1>
                                               <p>We encountered an error while loading the page. Please try refreshing, or come back later.</p>
                                               <p><a href="index.html" class="button button-primary">Go Back</a></p>
                                           </div>`;
            });
        }
    };

    // --- Start Application ---
    // Ensure DOM is fully loaded before manipulating it, though script is at end of body.
    // Using DOMContentLoaded for safety.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', App.start.bind(App));
    } else {
        App.start();
    }

})();
