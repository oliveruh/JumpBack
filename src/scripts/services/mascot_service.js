import UTILS from '../core/utils.js';
import { DATA_PATHS } from '../core/constants.js';

export const MASCOT_SERVICE = {
    /**
     * Fetch mascot JSON data from the configured path.
     * @returns {Promise} A promise that resolves to the mascot data
     */
    fetchMascotData: () => UTILS.fetchData(DATA_PATHS.MASCOTS),
    /**
     * Returns a random mascot pair
     * @param {Array} mascotData - An array of mascot data
     */
    getRandomMascotPair: (mascotData) => {
        if (!mascotData || mascotData.length === 0) return null;
        const index = Math.floor(Math.random() * mascotData.length);

        return mascotData[index];
    },
    /**
     * Returns image URL for a mascot
     * @returns {Promise} A promise that resolves to an object containing the success status and image URL
     */
    getMascotImageUrl: (mascot) => {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.src = mascot.image;

            img.onload = () => resolve({ success: true, url: mascot.image });
            img.onerror = () => {
                console.warn(`Failed to load image: ${mascot.image}. Using a placeholder.`);
                const placeholderUrl = `https://placehold.co/150x200/ffffff/333?text=${encodeURIComponent(
                    mascot.name.substring(0, 10)
                )}&font=bangers`;
                resolve({ success: false, url: placeholderUrl });
            };
        });
    }
}