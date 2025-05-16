'use strict';

import UTILS from './core/utils.js';
import CONSTANTS from './constants.js';
import ELEMENTS from './dom_elements.js';
import STATE from './state.js';
import { findJump } from './find_jump.js';

const fetchMascotData = async () => {
    return await UTILS.fetchData(CONSTANTS.dataPaths.mascots);
}

const createMascotImage = (character) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = character.image;

        img.onload = () => resolve({ success: true, url: character.image });
        img.onerror = () => {
            console.warn(`Failed to load image: ${imageUrl}. Using a placeholder.`);
            const placeholderUrl = `https://placehold.co/150x200/ffffff/333?text=${encodeURIComponent(
                character.name.substring(0, 10)
            )}&font=bangers`;
            resolve({ success: false, url: placeholderUrl });
        };
    });
};

const setMascotImage = async (container, character) => {
    if (!container) return;

    const { url } = await createMascotImage(character);

    container.style.backgroundImage = `url('${url}')`;
    container.setAttribute('alt', character.name);
    container.setAttribute('aria-label', character.name);

    if (url.includes("placehold.co")) {
        container.style.border = '1px dashed var(--panel-border)';
    }
};

const setFallbackDialogue = () => {
    if (ELEMENTS.mascotTopSpeechBubble)
        ELEMENTS.mascotTopSpeechBubble.textContent = "Ready to search?";
    if (ELEMENTS.mascotBottomSpeechBubble)
        ELEMENTS.mascotBottomSpeechBubble.textContent = "Enter your birth date!";
};

const loadMascotsPanel = async () => {
    const mascotData = await fetchMascotData();

    if (!mascotData || mascotData.length === 0) {
        console.error("Failed to load mascot data.");

        setFallbackDialogue();

        return;
    }

    const { topCharacter, bottomCharacter } = mascotData[Math.floor(Math.random() * mascotData.length)];

    ELEMENTS.mascotTopSpeechBubble.textContent = topCharacter.dialogue;
    ELEMENTS.mascotBottomSpeechBubble.textContent = bottomCharacter.dialogue;

    await Promise.all([
        setMascotImage(ELEMENTS.mascotTopImageContainer, topCharacter),
        setMascotImage(ELEMENTS.mascotBottomImageContainer, bottomCharacter),
    ]);
}

const setUpFindJumpButton = () => {
    ELEMENTS.findButton?.addEventListener('click', findJump);

    ELEMENTS.datePicker?.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            findJump();
        }
    });
};

const configureDatePickerLimits = () => {
    if (!ELEMENTS.datePicker) return;

    ELEMENTS.datePicker.max = CONSTANTS.maxDateAllowed;
    ELEMENTS.datePicker.min = CONSTANTS.minDateAllowed;
};

const checkForErrorMessage = () => {
    if (ELEMENTS.errorMessage) {
        ELEMENTS.errorMessage.textContent = STATE.errorMessageText;
        ELEMENTS.errorMessage.style.display = STATE.errorMessageText ? 'block' : 'none';
    }
}

export  {
    loadMascotsPanel, 
    setUpFindJumpButton, 
    configureDatePickerLimits, 
    checkForErrorMessage 
};