import { INDEX_ELEMENTS as ELEMENTS } from '../core/elements.js';
import { MASCOT_SERVICE as SERVICE } from '../services/mascot_service.js';

const setMascotImage = async (container, character) => {
    if (!container) return;

    const { url } = await SERVICE.getMascotImageUrl(character);

    container.style.backgroundImage = `url('${url}')`;
    container.setAttribute('aria-label', character.name);

    if (url.includes("placehold.co")) {
        container.style.border = '1px dashed var(--panel-border)';
    }
};

const setFallbackDialogue = () => {
  const topMascot = ELEMENTS.mascot.mascotTopSpeechBubble;
  const bottomMascot = ELEMENTS.mascot.mascotBottomSpeechBubble;

  if (topMascot) topMascot.textContent = "Ready to search?";
  if (bottomMascot) bottomMascot.textContent = "Enter your birth date!";
};

const renderMascotDialogue = (pair) => {
  ELEMENTS.mascot.mascotTopSpeechBubble.textContent = pair.topCharacter.dialogue;
  ELEMENTS.mascot.mascotBottomSpeechBubble.textContent = pair.bottomCharacter.dialogue;
};

const MASCOT_PANEL = {
    render: async () => {
        const mascotData = await SERVICE.fetchMascotData();
        const mascotPair = SERVICE.getRandomMascotPair(mascotData);

        if (!mascotPair) {
            console.error("[MASCOT PANEL] Failed to load mascot data.");

            setFallbackDialogue();

            return;
        }

        renderMascotDialogue(mascotPair);

        await Promise.all([
            setMascotImage(ELEMENTS.mascot.mascotTopImageContainer, mascotPair.topCharacter),
            setMascotImage(ELEMENTS.mascot.mascotBottomImageContainer, mascotPair.bottomCharacter),
        ]);
    }
}
export default MASCOT_PANEL;