export const createUI = (dependencies) => {
  const {
    elements,
    state,
    htmlTemplates,
    errorHandler,
    components
  } = dependencies;

  // Private components
  const createTabComponent = (component) => ({
    render: (issueData) => component.render(issueData)
  });

  const createPanelComponent = (component) => ({
    render: () => component.render()
  });

  // Error handling helper
  const handleError = (error, context) => {
    errorHandler.report(
      context,
      ERRORS.UI_RENDER_ERROR.code,
      error.message,
      { date: state.birthDateFromURL }
    );
  };

  // Public API
  return {
    renderTabs: async (issueData = state.ISSUE_DATA) => {
      try {
        const tabs = [
          components.tableOfContentsTab,
          components.statsTab,
          components.triviaTab,
          components.horoscopeTab,
          components.hiddenGemTab
        ];

        for (const tab of tabs) {
          await tab.render(issueData);
        }
      } catch (error) {
        handleError(error, state.context);
      }
    },

    renderPanels: async (issueData = state.ISSUE_DATA) => {
      try {
        await components.coverPanel.render(issueData);
        await components.extraPanel.render();
        await components.mainPanel.render(issueData);
      } catch (error) {
        handleError(error, state.context);
      }
    }
  };
};