const socket = new WebSocket("ws://localhost:8765");
const conversationDiv = document.getElementById("conversation");
const statusText = document.getElementById("status");
const startButton = document.getElementById("start");

let isBotSpeaking = false;
let recognition;

// Initialize Speech Recognition
function initSpeechRecognition() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    console.log("Speech Recognition Initialized!");

    recognition.onstart = () => {
        statusText.innerText = "🎤 Listening...";
    };

    recognition.onresult = async (event) => {
        if (isBotSpeaking) {
            console.log("User interrupted bot speech. Stopping bot...");
            speechSynthesis.cancel();  // Immediately stop bot speech
            isBotSpeaking = false;
        }

        const userSpeech = event.results[event.results.length - 1][0].transcript;
        console.log("User spoke:", userSpeech);
        addMessage("You", userSpeech);

        // Stop recognition temporarily to prevent multiple triggers
        recognition.abort();

        // Send user speech text to Python WebSocket
        socket.send(JSON.stringify({ type: "user_input", content: userSpeech }));

        // Restart recognition after a short delay to ensure stability
        setTimeout(() => {
            if (!isBotSpeaking) {
                console.log("Restarting Speech Recognition...");
                recognition.start();
            }
        }, 1000);
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        statusText.innerText = "⚠️ Error: Restarting...";
        setTimeout(() => recognition.start(), 2000); // Restart after error
    };

    recognition.start();
}

// WebSocket Event: Receive Message from Python
socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === "bot_response") {
        addMessage("Bot", data.content);
        speakText(data.content);  // Speak GPT response
    }
};

// Speak Text (Bot) with Interrupt Handling
function speakText(text) {
    isBotSpeaking = true;
    recognition.abort();  // Stop recognition when bot starts speaking

    const utterance = new SpeechSynthesisUtterance(text);




    let voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.name.includes("Google UK English Male")); // Change to a
//    utterance.voice = voices.find(voice => voice.name.includes("Microsoft David - English (United States)")) || voices[0];

    utterance.onstart = () => {
        isBotSpeaking = true;
    };

    utterance.onend = () => {
        isBotSpeaking = false;
        console.log("Bot finished speaking. Restarting recognition...");
        setTimeout(() => recognition.start(), 1000);  // Restart recognition safely
    };

    speechSynthesis.speak(utterance);
}


function listVoices() {
    let voices = speechSynthesis.getVoices();
    console.log("Available voices:", voices);
}

window.speechSynthesis.onvoiceschanged = listVoices;


// Add Message to Chat UI
function addMessage(speaker, text) {
    const msgDiv = document.createElement("p");
    msgDiv.innerText = `${speaker}: ${text}`;
    conversationDiv.appendChild(msgDiv);
}

// Start the chatbot
startButton.addEventListener("click", () => {
    initSpeechRecognition();
    startButton.disabled = true;
    addMessage("Bot", "Hello! How are you?");
    speakText("Hello! How are you?");
});
