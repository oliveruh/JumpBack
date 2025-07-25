import { RESULTS_ELEMENTS as ELEMENTS } from "../core/elements";
import { RESULTS_STATE as STATE } from "../core/state";
import { CONFIG, ERRORS } from "../core/constants";
import ERROR_HANDLER from "../handlers/error_handler";
import Utils from "../core/utils";

/**
 * HTML templates for rendering statistics related to the issue.
 */
const HTML = {
    title: `<h2 class="tab-section-title">Issue Statistics</h2>`,
    noStatsMessage: `<p class="text-muted">Statistics are currently unavailable for this issue.</p>`,
    noTocMessage: `<p class="text-muted">Table of Contents data is not available.</p>`,
    noCategoriesMessage: `<p class="text-muted">No series data for category stats.</p>`,
    noProcessedCategoryData: `<p class="text-muted">No category data after processing.</p>`,

    topSeriesSection: `<div class="stats-section"><h3 class="sub-heading">Top Series in this Issue:</h3>`,
    tagSection: `<div class="stats-section"><h3 class="sub-heading">Most Common Tags:</h3>`,

    rankingItem: (title, muUrl, iconClass) => `
        <li>
            <span class="stats-ranking-icon"><i class="${iconClass}"></i></span> 
            <div class="flex-grow-1">
                <span class="stats-ranking-title">${title}</span>
                ${muUrl ? `
                    <a href="${muUrl}" target="_blank" rel="noopener noreferrer" 
                       class="stats-mu-link" title="View on MangaUpdates">
                        <i class="fas fa-link"></i>
                    </a>` : ""}
            </div>
        </li>`,

    tagItem: (category, count) => `
        <li>
            <span class="list-icon"><i class="fas fa-chevron-right"></i></span>
            <div>
                <span class="list-item-title">${category}</span> 
                <span class="list-item-meta">(in ${count} series)</span>
            </div>
        </li>`,
};

export const STATS_TAB = {
    tabContainer: ELEMENTS.TABS.STATS,

    render: function (issueData = STATE.ISSUE_DATA) {
        if (!this.tabContainer) {
            ERROR_HANDLER.log("Stats tab panel element not found.");
            return;
        }

        const htmlParts = [HTML.title];

        if (!issueData?.table_of_contents || !STATE.allSeriesData) {
            htmlParts.push(HTML.noStatsMessage);
            this.tabContainer.innerHTML = htmlParts.join("");
            return;
        }

        this._renderTopSeries(htmlParts, issueData.table_of_contents);
        htmlParts.push('<hr class="separator">');
        const seriesDetails = this._getSeriesWithCategories(issueData.table_of_contents);
        this._renderTopCategories(htmlParts, seriesDetails);

        this.tabContainer.innerHTML = htmlParts.join("");
        this._renderTagChart(seriesDetails); // Draw chart after DOM update
    },

    _renderTopSeries: function (htmlParts, tocSeries) {
        htmlParts.push(HTML.topSeriesSection);
        const rankingIcons = ['fas fa-trophy gold', 'fas fa-trophy silver', 'fas fa-trophy bronze'];

        if (tocSeries.length > 0) {
            htmlParts.push('<ol class="stats-ranking-list">');
            tocSeries.slice(0, CONFIG.topSeriesCount).forEach((entry, index) => {
                const series = Utils.getSeriesById(entry.series_id);
                const iconClass = rankingIcons[index] || 'fas fa-star';
                htmlParts.push(HTML.rankingItem(entry.title, series?.mu_url, iconClass));
            });
            htmlParts.push('</ol></div>');
        } else {
            htmlParts.push(HTML.noTocMessage + '</div>');
        }
    },

    _getSeriesWithCategories: function (toc) {
        return toc
            .filter(item => item.series_id !== null)
            .map(item => Utils.getSeriesById(item.series_id))
            .filter(series => series !== null);
    },

    _renderTopCategories: function (htmlParts, seriesList) {
        htmlParts.push(HTML.tagSection);

        if (seriesList.length === 0) {
            htmlParts.push(HTML.noCategoriesMessage + '</div>');
            return;
        }

        const categoryCounts = seriesList.reduce((acc, series) => {
            (series.categories || []).forEach(cat => acc[cat] = (acc[cat] || 0) + 1);
            return acc;
        }, {});

        // Merge "Adapted to..." entries
        const mergedCounts = {};
        let adaptedTotal = 0;
        for (const [cat, count] of Object.entries(categoryCounts)) {
            if (cat.startsWith("Adapted to")) {
                adaptedTotal += count;
            } else {
                mergedCounts[cat] = count;
            }
        }
        if (adaptedTotal > 0) {
            mergedCounts["Adapted to other media"] = adaptedTotal;
        }

        const sorted = Object.entries(mergedCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
            htmlParts.push(`<div class="tag-chart-container"><canvas id="tagChart"></canvas></div>`);
            htmlParts.push('<ul class="content-list">');
            sorted.slice(0, CONFIG.topTagsListCount).forEach(([cat, count]) => {
                htmlParts.push(HTML.tagItem(cat, count));
            });
            htmlParts.push('</ul></div>');
        } else {
            htmlParts.push(HTML.noProcessedCategoryData + '</div>');
        }
    },

    _renderTagChart: function (seriesList) {
        // This function assumes Chart.js or equivalent is globally available
        const ctx = document.getElementById("tagChart");
        if (!ctx) return;

        const tagCounts = {};
        seriesList.forEach(s => {
            (s.categories || []).forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        const entries = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, CONFIG.topTagsChartCount);

        const labels = entries.map(([tag]) => tag);
        const data = entries.map(([, count]) => count);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Occurrences',
                    data,
                    backgroundColor: 'rgba(100, 149, 237, 0.6)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
};
