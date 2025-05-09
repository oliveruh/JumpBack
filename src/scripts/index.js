document.addEventListener('DOMContentLoaded', function () {

    umami.track();

    // --- Mascot Data ---
    const mascotData = [
        {
            series: "Dragon Ball",
            character1: { name: "Goku", dialogue: "This is gonna be SUPER! Let's blast off to your Jump issue!", image: "./assets/images/mascots/goku.png" },
            character2: { name: "Vegeta", dialogue: "Tch. Go ahead and tell your birthdate.", image: "./assets/images/mascots/vegeta.png" }
        },
        {
            series: "Naruto",
            character1: { name: "Naruto Uzumaki", dialogue: "Believe it! Your legendary Jump issue's out there, dattebayo!", image: "./assets/images/mascots/naruto.png" },
            character2: { name: "Kakashi Hatake", dialogue: "Yo. No need for a mask... unless you're hiding your birth year.", image: "./assets/images/mascots/kakashi.png" }
        },
        {
            series: "One Piece",
            character1: { name: "Monkey D. Luffy", dialogue: "Shishishi! Let's sail to your birth year's Jump treasure!", image: "./assets/images/mascots/luffy.png" },
            character2: { name: "Vinsmoke Sanji", dialogue: "Tch. I usually serve food, not magazines—but I’ll make an exception for you.", image: "./assets/images/mascots/sanji.png" }
        },
        {
            series: "Bleach",
            character1: { name: "Ichigo Kurosaki (Bankai)", dialogue: "Bankai! Time to slice open your Jump issue from the past!", image: "./assets/images/mascots/ichigo.png" },
            character2: { name: "Rukia Kuchiki", dialogue: "The Soul Society demands... your birth date. Now.", image: "./assets/images/mascots/rukia.png" }
        },
        {
            series: "My Hero Academia",
            character1: { name: "Izuku Midoriya (Full Cowl)", dialogue: "Plus Ultra! Let’s trace back to your heroic first Jump!", image: "./assets/images/mascots/deku.png" },
            character2: { name: "Katsuki Bakugo", dialogue: "You better not make me wait, nerd. Gimme the date!", image: "./assets/images/mascots/bakugo.png" }
        },
        {
            series: "Jujutsu Kaisen",
            character1: { name: "Yuji Itadori", dialogue: "This might get cursed, but we’re diggin’ up that Jump!", image: "./assets/images/mascots/yuji.png" },
            character2: { name: "Satoru Gojo", dialogue: "Relax, I’ve got six eyes and infinite style. That Jump issue’s as good as found.", image: "./assets/images/mascots/gojo.png" }
        },
        {
            series: "Demon Slayer",
            character1: { name: "Tanjiro Kamado", dialogue: "Total Concentration Breathing: Form Zero — Birthdate Reveal!", image: "./assets/images/mascots/tanjiro.png" },
            character2: { name: "Nezuko Kamado (in box)", dialogue: "Mmph! Mmph! (Translation: I'm hyped to find it!)", image: "./assets/images/mascots/nezuko.png" }
        },
        {
            series: "JoJo's Bizarre Adventure",
            character1: { name: "Jotaro Kujo", dialogue: "Yare yare daze... just spit out the date already.", image: "./assets/images/mascots/jotaro.png" },
            character2: { name: "Joseph Joestar (Young)", dialogue: "Your next line is... 'No way! That’s my Jump issue?!'", image: "./assets/images/mascots/joseph.png" }
        },
        {
            series: "Hunter x Hunter",
            character1: { name: "Gon Freecss", dialogue: "No matter what, I’ll hunt down that Jump!", image: "./assets/images/mascots/gon.png" },
            character2: { name: "Killua Zoldyck", dialogue: "This’ll be a shocker—give me the date already.", image: "./assets/images/mascots/killua.png" }
        },
        {
            series: "Death Note",
            character1: { name: "L", dialogue: "There’s an 80.2% chance your Jump issue is hidden in that birthdate.", image: "./assets/images/mascots/L.png" },
            character2: { name: "Light Yagami", dialogue: "Exactly as I planned... the Jump from the day your destiny began.", image: "./assets/images/mascots/light.png" }
        }
    ];

    // --- Element References ---
    const elements = {
        datePicker: document.getElementById('birthdatePicker'),
        findButton: document.getElementById('findButton'),
        errorMessage: document.getElementById('errorMessage'),
        mascot1SpeechBubble: document.getElementById('mascot1SpeechBubble'),
        mascot1ImageContainer: document.getElementById('mascot1Image'),
        mascot2SpeechBubble: document.getElementById('mascot2SpeechBubble'),
        mascot2ImageContainer: document.getElementById('mascot2Image'),
    };

    // --- Application State ---
    const state = {
        birthdate: '',
        errorMessageText: '',
    };

    // --- Update Mascot Panels ---
    function updateMascotPanels() {
        if (!mascotData || mascotData.length === 0) {
            console.warn("Mascot data is empty or not defined.");
            if (elements.mascot1SpeechBubble) elements.mascot1SpeechBubble.textContent = "Ready to search?";
            if (elements.mascot2SpeechBubble) elements.mascot2SpeechBubble.textContent = "Enter your birth date!";
            return;
        }

        const randomIndex = Math.floor(Math.random() * mascotData.length);
        const selectedPair = mascotData[randomIndex];

        // Helper to set background image and handle error
        const setMascotImage = (container, character) => {
            if (container) {
                const imageUrl = character.image;
                // Preload image to check if it exists before setting as background
                const img = new Image();
                img.onload = () => {
                    container.style.backgroundImage = `url('${imageUrl}')`;
                };
                img.onerror = () => {
                    console.warn(`Failed to load image: ${imageUrl}. Using placeholder.`);
                    container.style.backgroundImage = `url('https://placehold.co/150x200/ffffff/333?text=${encodeURIComponent(character.name.substring(0, 10))}&font=bangers')`;
                    container.style.border = '1px dashed var(--panel-border)'; // Optional: visual cue for placeholder
                };
                img.src = imageUrl; // Start loading
                container.setAttribute('aria-label', character.name);
            }
        };

        if (elements.mascot1SpeechBubble) {
            elements.mascot1SpeechBubble.textContent = selectedPair.character1.dialogue;
        }
        setMascotImage(elements.mascot1ImageContainer, selectedPair.character1);

        if (elements.mascot2SpeechBubble) {
            elements.mascot2SpeechBubble.textContent = selectedPair.character2.dialogue;
        }
        setMascotImage(elements.mascot2ImageContainer, selectedPair.character2);
    }


    // --- UI Update Function ---
    function updateUI() {
        if (elements.errorMessage) {
            elements.errorMessage.textContent = state.errorMessageText;
            elements.errorMessage.style.display = state.errorMessageText ? 'block' : 'none';
        }
    }

    // --- Date Validation ---
    function validateDate() {
        if (!elements.datePicker || !elements.datePicker.value) {
            umami.track('[START PAGE] Got an error', { 'error': 'No date selected' });
            state.errorMessageText = 'Please select a date.';

            updateUI();
            
            return false; 
        }

        const selectedDate = new Date(elements.datePicker.value + 'T00:00:00');
        const minDate = new Date('1968-07-11T00:00:00'); // Shonen Jump start date
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        state.errorMessageText = ''; // Reset 

        if (isNaN(selectedDate.getTime())) {
            umami.track('[START PAGE] Got an error', { 'error': 'Picked a date that is not valid', 'date': elements.datePicker.value });
            state.errorMessageText = 'Please enter a valid date.';
        } else if (selectedDate < minDate) {
            umami.track('[START PAGE] Got an error', { 'error': 'Picked a date before Shonen Jump started', 'date': elements.datePicker.value });
            state.errorMessageText = 'Weekly Shonen Jump started on July 11, 1968.';
        } else if (selectedDate > today) {
            umami.track('[START PAGE] Got an error', { 'error': 'Picked a date in the future', 'date': elements.datePicker.value });
            state.errorMessageText = 'Time travel not invented yet! Select a past date.';
        } else if (selectedDate > new Date('2021-05-24T00:00:00')) {
            umami.track('[START PAGE] Got an error', { 'error': 'Picked a date we don\'t have data for', 'date': elements.datePicker.value });
            state.errorMessageText = 'Sorry, we only have data until May 24, 2021.';
        }

        updateUI();
        return !state.errorMessageText; 
    }

    // --- Find Jump Action ---
    function findJump() {
        if (!elements.datePicker) return;

        state.birthdate = elements.datePicker.value;

        if (!validateDate() || !state.birthdate) {
            return;
        }

        if (elements.findButton) {
            elements.findButton.disabled = true; 
            elements.findButton.textContent = "Searching...";
        }

        umami.track('[START PAGE] Picked a date successfully', { 'date': state.birthdate });

        setTimeout(() => {
            console.log(`Loading issue for ${state.birthdate}. Navigating...`);

            window.location.href = `results.html?date=${state.birthdate}`;
        }, 1000);
    }

    // --- Event Listeners ---
    // Handle button click
    elements.findButton?.addEventListener('click', findJump);
    // Handler enter key
    elements.datePicker?.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            findJump();
        }
    });


    updateMascotPanels(); 
    updateUI();

    if (elements.datePicker) {
        elements.datePicker.max = '2021-05-24'; 
        elements.datePicker.min = '1968-07-11';
    }
});