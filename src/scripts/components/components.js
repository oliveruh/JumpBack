import { COVER_PANEL } from "./panels/cover_panel";
import { EXTRA_PANEL } from "./panels/extra_panel";

export const buildComponents = (coreDeps) => ({
  createExtraPanel: EXTRA_PANEL(coreDeps),
  createCoverPanel: COVER_PANEL(coreDeps),
});