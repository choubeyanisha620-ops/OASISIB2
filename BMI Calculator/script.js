// --- App State & Initialization ---
const STORAGE_KEY = 'smart_bmi_data';
let bmiData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let bmiChartInstance = null;

const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const calculateBtn = document.getElementById('calculate-btn');
const resultSection = document.getElementById('result-section');

// Theme Toggle
themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    body.classList.toggle('dark-theme');
    const isLight = body.classList.contains('light-theme');
    themeToggle.innerHTML = isLight ? "<i class='bx bx-moon'></i>" : "<i class='bx bx-sun'></i>";
    updateChartTheme();
});

// Toast Notifications
function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- BMI Calculation Logic ---
function getCategoryAndColor(bmi) {
    if (bmi < 18.5) return { cat: 'Underweight', color: 'var(--cat-underweight)', bg: 'rgba(56, 189, 248, 0.2)' };
    if (bmi < 25) return { cat: 'Normal', color: 'var(--cat-normal)', bg: 'rgba(34, 197, 94, 0.2)' };
    if (bmi < 30) return { cat: 'Overweight', color: 'var(--cat-overweight)', bg: 'rgba(250, 204, 21, 0.2)' };
    return { cat: 'Obese', color: 'var(--cat-obese)', bg: 'rgba(239, 68, 68, 0.2)' };
}

function getAdvice(bmi) {
    if (bmi < 18.5) return "Consider increasing your calorie intake with nutrient-dense, protein-rich foods to reach a healthy weight.";
    if (bmi < 25) return "Great job! You have a healthy body weight. Keep maintaining your balanced diet and active lifestyle.";
    if (bmi < 30) return "You may benefit from adding regular cardiovascular exercise and reducing processed foods.";
    return "It's highly recommended to consult with a healthcare provider for personalized guidance and health screening.";
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = (progress * (end - start) + start).toFixed(1);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

calculateBtn.addEventListener('click', () => {
    const name = document.getElementById('name').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);

    // Basic Validation
    if (!weight || !height || weight <= 0 || height <= 0) {
        showToast("Please enter valid positive numbers for weight and height.");
        return;
    }
    
    // Auto-focus logic / Clean formatting could go here
    document.activeElement.blur(); // dismiss keyboard

    // Calculate
    const bmi = weight / (height * height);
    const { cat, color, bg } = getCategoryAndColor(bmi);
    const advice = getAdvice(bmi);

    // Update UI
    resultSection.classList.remove('hidden');
    resultSection.classList.remove('fade-in');
    void resultSection.offsetWidth; // trigger reflow
    resultSection.classList.add('fade-in');

    const bmiElement = document.getElementById('bmi-value');
    animateValue(bmiElement, 0, bmi, 1000);
    
    const catBadge = document.getElementById('bmi-category');
    catBadge.innerText = cat;
    catBadge.style.color = color;
    catBadge.style.backgroundColor = bg;

    document.getElementById('ai-advice-text').innerText = advice;

    // AI Voice read out
    speakText(`BMI calculated. ${name ? 'Hello ' + name + ', ' : ''}Your BMI is ${bmi.toFixed(1)}. You are in the ${cat} category. ${advice}`);

    // Save Data
    saveData({
        name: name || 'Anonymous',
        age, gender, weight, height, 
        bmi: parseFloat(bmi.toFixed(2)), 
        category: cat,
        date: new Date().toLocaleDateString()
    });
});

// --- Data & Dashboard ---
function saveData(entry) {
    bmiData.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bmiData));
    updateDashboard();
    updateChart();
}

function updateDashboard() {
    document.getElementById('dash-users').innerText = bmiData.length;
    
    if (bmiData.length > 0) {
        const sum = bmiData.reduce((acc, curr) => acc + curr.bmi, 0);
        document.getElementById('dash-avg').innerText = (sum / bmiData.length).toFixed(1);
        
        const last = bmiData[bmiData.length - 1];
        document.getElementById('dash-last').innerText = last.bmi.toFixed(1);
    }
}

// --- Chart.js Graph ---
function getCssVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function updateChartTheme() {
    if (bmiChartInstance) {
        const textColor = getCssVariable('--text-secondary');
        bmiChartInstance.options.scales.x.ticks.color = textColor;
        bmiChartInstance.options.scales.y.ticks.color = textColor;
        bmiChartInstance.update();
    }
}

function updateChart() {
    if (bmiData.length === 0) return;
    
    const ctx = document.getElementById('bmiChart').getContext('2d');
    const labels = bmiData.map((d, i) => d.name !== 'Anonymous' ? d.name : `User ${i+1}`);
    const data = bmiData.map(d => d.bmi);

    const textColor = getCssVariable('--text-secondary');
    const primaryColor = getCssVariable('--accent-blue');

    if (bmiChartInstance) {
        bmiChartInstance.data.labels = labels;
        bmiChartInstance.data.datasets[0].data = data;
        bmiChartInstance.update();
    } else {
        bmiChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'BMI Trend',
                    data: data,
                    borderColor: primaryColor,
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: primaryColor,
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { ticks: { color: textColor }, grid: { display: false } },
                    y: { 
                        ticks: { color: textColor }, 
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        suggestedMin: 15, suggestedMax: 35
                    }
                }
            }
        });
    }
}

// --- Web Speech API (Voice Engine) ---
const synth = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function speakText(text) {
    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    // Set a good default English voice if available
    const voices = synth.getVoices();
    const premiumVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Siri")) || voices[0];
    if (premiumVoice) utterance.voice = premiumVoice;
    
    synth.speak(utterance);
}

// Force load voices
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => synth.getVoices();
}

// Voice Assistant mode
const mainMic = document.getElementById('floating-mic');
const pulse = document.getElementById('voice-pulse');
const overlay = document.getElementById('voice-overlay');
const statusText = document.getElementById('voice-status-text');

let isListeningForMode = false; // Tracking big assistant flow
let currentTargetInput = null; // tracking inline mic flow

function listenForInput(callback, promptText) {
    if (!SpeechRecognition) {
        showToast("Speech Recognition not supported in this browser.");
        return;
    }
    
    if (promptText) {
        speakText(promptText);
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // UI Feedback
    mainMic.classList.add('listening');
    pulse.classList.remove('hidden');
    
    // When called from the main voice assistant overlay
    if (isListeningForMode) {
        overlay.classList.add('active');
        statusText.innerText = `Listening for ${currentTargetInput}...`;
    }

    recognition.start();

    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        // Parse numbers out of transcript if needed
        const numberMatch = transcript.match(/\d+(\.\d+)?/);
        const finalText = numberMatch ? numberMatch[0] : transcript;
        callback(finalText);
    };

    recognition.onerror = (e) => {
        showToast('Voice input failed: ' + e.error);
        stopListeningUI();
    };

    recognition.onend = () => {
        stopListeningUI();
    };
}

function stopListeningUI() {
    mainMic.classList.remove('listening');
    pulse.classList.add('hidden');
    overlay.classList.remove('active');
}

// Bind inline microphones
document.querySelectorAll('.inline-mic').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentTargetInput = e.currentTarget.getAttribute('data-target');
        const inputField = document.getElementById(currentTargetInput);
        
        isListeningForMode = false;
        listenForInput((val) => {
            inputField.value = val;
        }, null);
    });
});

// Full Voice Assistant Flow
mainMic.addEventListener('click', async () => {
    isListeningForMode = true;
    
    // Helper to wrap listening in a Promise
    const askAndListen = (target, prompt) => {
        return new Promise((resolve) => {
            currentTargetInput = target;
            
            // Wait for synth to finish speaking prompt, then start recognition
            const utterance = new SpeechSynthesisUtterance(prompt);
            utterance.onend = () => {
                listenForInput(resolve, null);
            };
            synth.speak(utterance);
        });
    };

    try {
        const weight = await askAndListen('weight', "Please tell me your weight in kilograms.");
        if (weight) document.getElementById('weight').value = parseFloat(weight);

        // short pause
        await new Promise(r => setTimeout(r, 500));

        const height = await askAndListen('height', "Please tell me your height in meters.");
        if (height) document.getElementById('height').value = parseFloat(height);

        calculateBtn.click();
    } catch (err) {
        stopListeningUI();
    }
});

// Init
updateDashboard();
updateChart();
