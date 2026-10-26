# JumpBack — Dev Alley 2027

Implementation and validation: 24 October 2026. Starting commit: `36a0d74` on
`master`. Working branch: `feature/dev-alley-2027`. No deployment was performed.

## Audit of the code actually published

Before this change:

| Page | Active entry | Actual behavior |
| --- | --- | --- |
| `src/index.html` | `src/scripts/index.js`, classic/defer | Embedded mascots; duplicated date rules, hardcoded bounds and a 1-second navigation delay; unguarded Umami calls. |
| `src/results.html` | `src/scripts/results.js`, classic/defer | Loads the entire `data/wsj_info.json`; no URL validation or maximum coverage check; 1.2-second delay; null issue dereference during metadata rendering. |
| `src/br/index.html` | `src/br/scripts/index.js`, **module** | Imports `ui.js`, which imports `core/utils.js`, root constants/state/DOM definitions and `find_jump.js`. The module declaration was already correct. The mascot image failure path refers to undeclared `imageUrl`; analytics calls can abort initialization. |
| `src/br/results.html` | `src/br/scripts/results.js`, classic/defer | Loads the entire series catalog before checking the URL, then issues; includes Chart.js synchronously; most extra feature labels remain English; Trivia is disabled in HTML. |

The separate modular refactor was not a working production entry point:

- `pages/index.js` and `pages/results.js` were not included in the HTML.
- `core/elements.js` imports UI modules, creating dependencies back into renderers;
  several imports omit `.js`, which a plain static server does not resolve.
- `core/state.js` uses an undefined `elements` variable. Field names vary between
  `ISSUE_DATA`, `currentIssueData`, `ALL_SERIES_DATA` and `allSeriesData`.
- `services/issues_service.js` exports `ISSUES_SERVICE` but calls undefined
  `IssuesService`; it relies on a missing `UTILS.findMagazineForDate`.
- `services/validation_service.js` returns `valid`, while `pages/results.js` reads
  `isValid`; the caller also omits its expected date bounds.
- `services/analytics_service.js` uses optional chaining on an undeclared global,
  which still throws when Umami is absent, and identifies visitors using birth dates.
- `ui/results_ui.js` references unimported builders, panels and tab renderers;
  `ui/extra_panel_ui.js` checks undefined `PANEL`.
- `ui/stats_tab_ui.js` expects utilities and configuration names that do not exist.
  `ui/trivia_tab_ui.js`, `ui/horoscope_tab_ui.js`, and `ui/hidden_gem_tab_ui.js` are empty.
- `refactored_index.js`, `refactor_results.js`, root helper scripts, `components/`,
  `templates/`, and the parallel `pages/` tree are retained experiments or retired
  code, not activated by this implementation.

Now all four HTML documents load exactly one module entry. Those four entry files
are thin adapters to `src/scripts/shared/home.js` and `results.js`, with shared
`catalog.js`, `data.js`, `locale.js`, and `share.js`. Neither the experimental
refactor nor any analytics/Chart.js script is reachable from this graph. Both
languages use the original root `css/style.css` plus `css/reveal.css`;
`src/br/css/style.css` is retained but not loaded.

## Historical data and matching semantics

The unchanged source datasets contain **2,600 unique issues and cover dates**,
from **1968-08-01 through 2021-05-24**, across 54 calendar years. EN and PT issue
records have identical IDs, issue numbers, dates and contents; their image hosts
differ. The two `wsj_series.json` files are identical (643 series).

`cover_date` is used exactly as recorded. It is **not** reinterpreted as an actual
on-sale date. Lookup returns the issue with the largest recorded `cover_date`
less than or equal to the visitor's date. Gaps use the preceding recorded issue;
there is no interpolation or invented weekly release. Dates before the first or
after the last record are rejected. In particular, July 11, 1968 was an old
hardcoded limit, not the earliest date represented by the actual dataset.

The existing `issue_number` values run sequentially from 1 to 2600 in these data.
The UI therefore labels them **Archive issue / Edição no acervo**, without
claiming that they are the annual issue numbers printed on the physical covers.
No issue/date associations were changed.

Validation rejects absent, duplicate, non-ISO, impossible calendar, future and
out-of-coverage dates on both the form and direct result URLs. Dates are calendar
strings; timezone conversion cannot shift the matching day. Corrupt, empty,
unsorted or duplicate-ID/date catalogues fail explicitly.

## What changed for visitors

- Immediate form and loading feedback; no artificial navigation or reveal delay.
- A screenshot-ready result card: real cover, archive number, recorded cover date,
  selected date, and up to three unique series whose IDs resolve in the source
  series catalog. Order follows the recorded contents, with no invented ranking.
- Existing logo, manga background, orange/yellow ink, halftone, panels and comic
  font choices retained. The legacy home grid's large empty area was corrected.
- A short CSS reveal with no mandatory wait; reduced-motion disables animations.
- A full recorded contents view, category statistics, source trivia, playful
  horoscope and Hidden Gem are available in both languages. Extras load on demand.
- Statistics use an accessible list and native meters; Chart.js is unnecessary.
  Category counts use unique identified series. The Hidden Gem keeps the original
  fewest-positive-MangaUpdates-votes rule, breaking ties by saved rating, and
  explains that it is not historical popularity.
- English source titles/prose are preserved rather than fabricating translations.
  PT-BR labels explicitly identify English trivia/descriptions; source prose has
  `lang="en"`. The horoscope uses its existing localized dataset.
- Visible form labels, status/error announcements, keyboard submission, skip links,
  focus indicators, and keyboard tabs (arrows, Home, End) are implemented.
- Sharing uses Web Share, then Clipboard API, then selection-based copying. If all
  automatic methods fail, a selectable link is shown. Cancellation is distinct
  from failure. Shared links contain only a validated `date` parameter and preserve
  language. The UI explains that the selected date is included.
- Returning to search preserves the selected date. Switching result language
  preserves it as well.

## Failures and privacy

The core result does not wait for series metadata, horoscope, fonts, analytics,
or a chart library. JSON requests have a 12-second abort timeout; failed requests
can be retried. Covers try up to three **existing source URLs for the same issue**,
with 20 seconds for the preferred original scan and 5 seconds for each alternate
CDN candidate. No placeholder service, fabricated
cover or constructed issue URL is used. If every source fails, a local text state
and Retry cover control remain alongside the issue metadata and series names.

Umami's script and all tracking/identification calls were removed from the
published graph. There is no birthdate identity, date event payload, analytics
request or browser storage. A no-referrer policy prevents the selected date's URL
from leaking to external cover/font/link hosts. Hosting providers still receive
the ordinary page URL in HTTP requests; this change does not control their logs.
Inactive experimental analytics code remains clearly documented as inactive.

Open Graph and Twitter images remain static, generic site assets. Changing the
browser's title after loading does not generate per-result social previews. No
backend, login, server-side image generation or new historical expansion was added.

## Static performance optimization

`node tools/build-catalog.mjs` validates agreement between the existing source
files, then emits `src/data/generated/catalog.json` and 54 year files. The files
are committed: Neocities still uploads `src` directly, with no build step in its
deployment workflow. `npm run catalog:check` detects stale generated files. Re-run
`npm run catalog` only after an intentional source-data update.

The home loads the compact index for actual bounds. Results load that index plus
only the matching year's issue details. Series and horoscope load only when their
extras are opened. In-page request caching shares series data across tabs, while
rejected requests are evicted for retry. The large legacy JSON files remain intact
and are no longer required by the core reveal.

Measured locally with Node 24.22.1: seven HTTP fetch+JSON-parse samples per file,
median after warming the connection; an in-memory local server sends uncompressed
bytes with caching disabled. Separate parse medians exclude byte-to-string
conversion. Gzip sizes are calculated, not a claim about Neocities compression.
Reproduce with `npm run measure`.

| File | Bytes | Gzip bytes | Local fetch + parse median (ms) | Parse median (ms) |
| --- | ---: | ---: | ---: | ---: |
| data/wsj_info.json | 4079886 | 587617 | 22.37 | 6.84 |
| data/wsj_issues.json | 4771725 | 383658 | 29.71 | 14.70 |
| br/data/wsj_issues.json | 4761325 | 383492 | 22.41 | 10.16 |
| data/wsj_series.json | 1035547 | 281289 | 3.90 | 1.80 |
| data/generated/catalog.json | 148600 | 22511 | 1.15 | 0.48 |
| data/generated/issues/1968.json | 14657 | 3241 | 0.42 | 0.03 |
| data/generated/issues/2000.json | 106380 | 14469 | 0.86 | 0.27 |
| data/generated/issues/2021.json | 63699 | 11429 | 0.50 | 0.11 |


For a date matching the year 2000, essential JSON is 148,600 + 106,380 =
**254,980 bytes**, compared with 4,079,886 bytes for the old EN reveal (**93.8% less**)
and 4,761,325 + 1,035,547 = 5,796,872 bytes for the old PT reveal (**95.6% less**).
Calculated gzip totals are 36,980 vs 587,617 (EN) or 664,781 (PT). The first EN
result needs two small JSON requests instead of one large request; PT keeps two
initial JSON requests while deferring extras. Fewer initial bytes, not fewer
requests in every case, is the relevant gain. Removed artificial waits totalled
2.2 seconds across the old input-to-result journey. Local HTTP timings exclude
public network latency, image transfer and rendering and are not a production
speed or Core Web Vitals claim.

## Validation and reproducibility

Prerequisites: Node 20+ and npm; no runtime npm dependencies.

```bash
npm ci
npx playwright install chromium
npm test
npm run catalog:check
npm run test:smoke
npm run measure
```

Serve `src` with any ordinary static HTTP server for manual use; ES modules cannot
be opened using `file://`. An alternate installed browser executable can be used
with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/absolute/path/to/chromium npm run test:smoke`.
Playwright is a development-only dependency, never shipped with the application.

- `npm test`: **9 passing tests**, including all 2,600 source identities in both
  locales, calendar boundaries, leap years, gap matching, duplicate parameters,
  generated/source parity and the published module graph.
- `npm run catalog:check`: all 2,600 records and 54 year files verified.
- `npm run test:smoke`: **44 passing browser scenarios** using Chromium
  133.0.6943.0, Playwright 1.51.1, 1440×1000 desktop and 390×844 mobile emulation.
  EN/PT cover form submission, exact archive endpoints, missing/malformed/early/late/
  future/duplicate date URLs, dataset HTTP failures, corrupt catalogues, missing
  issue details, home failure/retry, all cover failures, successful cover fallback,
  a slow original image, optional series/horoscope failure, blocked external
  libraries and throwing analytics, lazy requests, all tabs and keyboard tab
  navigation, native/cancelled/rejected sharing, Clipboard API/legacy/manual copying,
  language switching, return to search, reduced motion and viewport overflow.
  There were no uncaught page errors or horizontal overflow.
- `git diff --check`: clean. The six historical issue/info/series source files have
  no diff against the starting branch.
- Visual inspection: EN/PT desktop and mobile home/result/card captures reviewed.
  The first issue's real Comic Vine cover was fetched (HTTP 200, JPEG, 132,683 bytes)
  and replayed for deterministic screenshots. Live source probes also returned
  HTTP 200 JPEG for record 1576 (2000-01-01, 2,883,808 bytes) and record 2604
  (2021-05-24, 1,271,963 bytes). The two alternate CDN probes returned HTTP 503
  from this environment, so original source URLs are preferred. This does not
  establish global CDN availability. Automated image-success cases deliberately
  use a tiny test fixture; they test loading behavior, not historical pixels.

The browser provided by the environment's initial Playwright runtime could not
be downloaded. A temporary Chromium binary from the npm-distributed
`@sparticuz/chromium@133.0.0` package was used via the documented executable override.
This package and binary are not project dependencies and are not deployed.

## Remaining limitations

- The archive still ends in May 2021. No new historical records were invented.
- Covers depend on external hosts. Three samples were live-probed; availability
  and historical accuracy of all 2,600 cover files were not independently audited.
  Original scans may be several megabytes. Missing or slow remote images have
  bounded fallback and do not block metadata, contents, extras or sharing.
- Source trivia, descriptions, chapter labels and categories remain English where
  no Portuguese source exists. UI and essential flows are localized.
- Gaps and source errors remain properties of the supplied archive; matching is
  based on recorded cover dates, not a verified calendar of actual circulation.
- Mobile testing used emulation. No physical Android/iOS, Safari, Firefox, screen
  reader or live Neocities deployment was tested in this task. Native share API
  success/cancellation/failure was simulated; OS share sheets require device QA.
- Clipboard support depends on browser permissions and secure context. Manual
  copying remains available. Fonts have system fallbacks if local WOFF2 loading fails.
- Social preview cards are generic static assets. Screenshot sharing is manual.
- Experimental refactor files remain for reference and are not supported entry
  points. The import-graph test guards against accidentally loading them.

## Classic visual direction — 26 October 2026

The visual follow-up now follows the owner's original JumpBack screenshot:

- The centered logo is back inside the orange diagonal-striped masthead.
- The original manga collage is more visible around the paper page.
- White halftone panels, thick black borders, small skew transforms and offset
  shadows frame the search and both character panels.
- The orange comic heading and explanatory speech bubble are centered above the
  vertically stacked date field and orange Find My Jump action.
- The existing character illustrations appear beneath their speech bubbles;
  they load through the working shared implementation in both languages.
- Results use the same masthead, ink outlines, halftone information panel and
  orange controls, while preserving the larger cover, series, extras and sharing.
- Mobile keeps the accessible form and fixed result actions. Extra tabs wrap
  into visible rows; long contents use ordinary page scroll.
- Bangers/Rubik are still local, licensed WOFF2 assets. No new dependencies or
  historical source changes were introduced.

Validation: the 9 automated tests and 44 browser scenarios passed. EN/PT captures
were inspected at desktop and mobile sizes. The image below is an actual rendered
PT-BR homepage at 1024×900, with a sample date entered; it is not an AI mockup.

![Classic JumpBack homepage](images/classic-home.jpg)

### Detail polish within the classic identity

The follow-up keeps the orange masthead, original logo, manga collage, halftone
panels, speech bubbles, character art and comic typefaces. Changes are limited to
the shared stylesheet, documentation and real browser captures:

- Matching date field and search-button widths, tighter vertical rhythm, and
  readable 12px coverage text instead of the previous 10px mobile helper.
- Stronger muted-text contrast, a visible invalid-field border, and removal of
  the legacy error-text shadow.
- A mobile masthead grid that reserves space for the language switch without
  the previous fixed horizontal logo offset; language controls are 40px high.
- Larger character-bubble text on mobile; character panels stack at 380px and
  below so long messages remain readable.
- More comfortable result-title line height, metadata spacing and series rows,
  plus a stronger cover shadow against its dark backing.
- Extras tabs wrap on mobile, exposing all categories without sideways scrolling.
  Existing arrow-key/End navigation and selected-tab semantics are preserved.
- Stationary paper-panel shadows and consistent disabled-button feedback.

Validation: 9 automated tests and all 44 browser scenarios passed. Additional
browser QA covered home and results in both languages at 320, 390, 768 and 1024px
(16 viewport/page/language combinations): no document overflow or logo/language
overlap, matching input/button widths, search visible within an 844px viewport,
visible keyboard focus, and mobile tabs within the viewport with 44px touch
targets. All assertions passed. Desktop/mobile captures were visually reviewed.
These are Chromium checks; the device/browser limitations above still apply.

![Polished mobile homepage](images/classic-home-mobile.jpg)

![Polished result card using the existing 2000-01-01 source cover](images/classic-result-card.jpg)

The implementation remains on the working feature branch; no deployment was made.
