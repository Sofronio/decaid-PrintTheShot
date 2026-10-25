/**
 * The Streamline skin asks each plugin's `skin` endpoint what to draw, and runs
 * only the actions it knows — no plugin code runs in the skin.
 *
 * The answer adds a **PTS** button to the dashboard header (and over the
 * screensaver), and both open this plugin's page as a fitted overlay: the
 * floating window over the dashboard, sized to the page's own content. The page
 * reports that size and closes itself by message (see print-the-shot.ts).
 *
 * `showButton` is the ShowPtsButton setting. Turning it off answers with no
 * surfaces, which is how the skin removes the buttons on its next read; the
 * page itself stays available at its Web UI address.
 */
export function skinAnswer(showButton = true): Record<string, unknown> {
  if (!showButton) return { version: 1, surfaces: [] };

  const openPage = {
    type: "open",
    view: "main",
    presentation: "overlay",
    fit: true,
  };

  return {
    version: 1,
    surfaces: [
      {
        id: "pts-page",
        kind: "header-button",
        label: "PTS",
        action: openPage,
      },
      {
        id: "pts-saver",
        kind: "screensaver-button",
        label: "PTS",
        action: openPage,
      },
    ],
  };
}
