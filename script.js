const keyMap = new Map();
const activeNotes = new Map();
const status = document.querySelector("#status");
const keys = document.querySelectorAll(".key");

let audioContext;

const noteFrequencies = {
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  "D#4": 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392,
  "G#4": 415.3,
  A4: 440,
  "A#4": 466.16,
  B4: 493.88,
  C5: 523.25,
};

keys.forEach((key) => {
  keyMap.set(key.dataset.key.toLowerCase(), key);

  key.addEventListener("pointerdown", () => playKey(key));
  key.addEventListener("pointerup", () => stopKey(key));
  key.addEventListener("pointerleave", () => stopKey(key));
  key.addEventListener("blur", () => stopKey(key));
});

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  const key = keyMap.get(event.key.toLowerCase());
  if (key) {
    event.preventDefault();
    playKey(key);
  }
});

window.addEventListener("keyup", (event) => {
  const key = keyMap.get(event.key.toLowerCase());
  if (key) {
    event.preventDefault();
    stopKey(key);
  }
});

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function playKey(key) {
  const note = key.dataset.note;

  if (activeNotes.has(note)) return;

  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "triangle";
  oscillator.frequency.value = noteFrequencies[note];
  filter.type = "lowpass";
  filter.frequency.value = 1800;

  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.42, context.currentTime + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.16);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start();

  activeNotes.set(note, { oscillator, gain });
  key.classList.add("active");
  status.textContent = note;
}

function stopKey(key) {
  const note = key.dataset.note;
  const activeNote = activeNotes.get(note);

  if (!activeNote || !audioContext) return;

  const { oscillator, gain } = activeNote;
  const stopAt = audioContext.currentTime + 0.08;

  gain.gain.cancelScheduledValues(audioContext.currentTime);
  gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
  oscillator.stop(stopAt);

  activeNotes.delete(note);
  key.classList.remove("active");
  status.textContent = activeNotes.size ? "Playing" : "Ready";
}
