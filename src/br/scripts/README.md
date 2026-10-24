# Script status

The only published Portuguese entry points are `index.js` and `results.js`.
They import the tested implementation in `src/scripts/shared/`.

The older `core/`, `services/`, `pages/`, `ui/`, `handlers/`, `components/`,
`templates/` directories and other scripts in this folder are retained experiments
or retired legacy code. They are **not imported by the current pages** and are
not a working alternative application. In particular, do not load `pages/results.js`
or `refactor_results.js` to enable extra features.

See `docs/dev-alley-2027.md` for the audit, known inconsistencies, data coverage,
maintenance commands and test results. Future changes should target the shared
implementation. A regression test checks the published import graph.
