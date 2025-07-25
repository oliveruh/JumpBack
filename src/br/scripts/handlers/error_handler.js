import ANALYTICS from "../services/analytics_service";

const ERROR_HANDLER = {
    report: function (context, error, message, extra = {}) {
        console.error(`[ERROR] ${message}`);

        ANALYTICS.trackError(
            context,
            error,
            ...extra
        );
    },
    warn: function (context, error, message, extra = {}) {
        console.warn(`[WARNING] ${message}`);

        ANALYTICS.trackError(
            context,
            error,
            ...extra
        );
    },
};

export default ERROR_HANDLER;
