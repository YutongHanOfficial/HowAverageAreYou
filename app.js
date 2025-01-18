import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-4fuqlH4nK6xnWbgYJ_kAE6I-zmMsYW0",
  authDomain: "above-average.firebaseapp.com",
  databaseURL: "https://above-average-default-rtdb.firebaseio.com",
  projectId: "above-average",
  storageBucket: "above-average.appspot.com",
  messagingSenderId: "70807736682",
  appId: "1:70807736682:web:7ef92ca8d58465c5881513",
  measurementId: "G-YZYR1FZHLQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM elements
const questionDiv = document.getElementById("question");
const aboveAverageBtn = document.getElementById("aboveAverage");
const belowAverageBtn = document.getElementById("belowAverage");
const statsDiv = document.getElementById("stats");

let questions = [];
let currentQuestionIndex = 0;
let votesData = {};

// Fetch questions and votes data
async function init() {
  try {
    const [questionsResponse, votesSnapshot] = await Promise.all([
      fetch("questions.json"),
      get(ref(db, "votes"))
    ]);

    questions = await questionsResponse.json();
    votesData = votesSnapshot.exists() ? votesSnapshot.val() : {};
    loadQuestion();
  } catch (error) {
    console.error("Error initializing app:", error);
  }
}

// Load the current question
function loadQuestion() {
  if (currentQuestionIndex >= questions.length) {
    currentQuestionIndex = 0; // Loop back to the start
  }

  const question = questions[currentQuestionIndex];
  questionDiv.textContent = question.text;
  updateStats(question.id);
}

// Update stats for the current question
function updateStats(questionId) {
  const data = votesData[questionId] || { above: 0, below: 0 };
  const totalVotes = data.above + data.below;
  const abovePercent = totalVotes > 0 ? ((data.above / totalVotes) * 100).toFixed(2) : 0;
  const belowPercent = totalVotes > 0 ? ((data.below / totalVotes) * 100).toFixed(2) : 0;

  statsDiv.innerHTML = `
    <p>Total Votes: ${totalVotes}</p>
    <p>Above Average: ${abovePercent}%</p>
    <p>Below Average: ${belowPercent}%</p>
  `;
}

// Handle a vote
function handleVote(isAbove) {
  const questionId = questions[currentQuestionIndex].id;
  votesData[questionId] = votesData[questionId] || { above: 0, below: 0 };

  if (isAbove) {
    votesData[questionId].above++;
  } else {
    votesData[questionId].below++;
  }

  update(ref(db, "votes"), { [questionId]: votesData[questionId] })
    .then(() => {
      currentQuestionIndex++;
      loadQuestion();
    })
    .catch((error) => {
      console.error("Error updating votes:", error);
    });
}

// Event listeners for buttons
aboveAverageBtn.onclick = () => handleVote(true);
belowAverageBtn.onclick = () => handleVote(false);

// Initialize app
init();
