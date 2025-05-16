import { TABLE_OF_CONTENTS_TAB } from "../ui/table_of_contents_tab_ui.js";
import { RESULTS_STATE as STATE } from "../core/state.js";
import { EXTRA_PANEL } from "../ui/extra_panel_ui.js";
import ERROR_HANDLER from "../handlers/error_handler.js";

export const UI = {
    renderTabs: async function () {
        try {
            TABLE_OF_CONTENTS_TAB.render(STATE.ISSUE_DATA);
            STATS_TAB.render(STATE.ISSUE_DATA);
            TRIVIA_TAB.render(STATE.ISSUE_DATA);
            HOROSCOPE_TAB.render(STATE.ISSUE_DATA);
            HIDDEN_GEM_TAB.render(STATE.ISSUE_DATA);
        } catch (error) {
            ERROR_HANDLER.report(
                STATE.context,
                null,
                error.message,
                { date: STATE.birthDateFromURL }
            );
        }
    },
    renderPanels: async function () {
        try {
            COVER_PANEL.render(STATE.ISSUE_DATA);

            EXTRA_PANEL.render();

            MAIN_PANEL.render(STATE.ISSUE_DATA);
        } catch (error) {
            ERROR_HANDLER.report(
                STATE.context,
                null,
                error.message,
                { date: STATE.birthDateFromURL }
            );
        }
    }
}