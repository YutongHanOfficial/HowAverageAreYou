import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQ5_pbAH7nGM2ACJ1gJGOvBKdSJ2nmCIY",
  authDomain: "how-average-are-you-a6486.firebaseapp.com",
  databaseURL: "https://how-average-are-you-a6486-default-rtdb.firebaseio.com",
  projectId: "how-average-are-you-a6486",
  storageBucket: "how-average-are-you-a6486.firebasestorage.app",
  messagingSenderId: "787221670121",
  appId: "1:787221670121:web:d18c02ca0f2b66fca56878",
  measurementId: "G-DQDLLPBNK0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM elements
const questionDiv = document.getElementById("question");
const aboveAverageBtn = document.getElementById("aboveAverage");
const belowAverageBtn = document.getElementById("belowAverage");
const statsDiv = document.getElementById("stats");
const canvas = document.getElementById("votesVisualization");
const ctx = canvas.getContext("2d");

let questions = [];
let currentQuestionIndex = 0;
let votesData = {};

// Utility function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Fetch questions and votes data
async function init() {
  try {
    const [questionsResponse, votesSnapshot] = await Promise.all([
      fetch("questions.json"),
      get(ref(db, "votes"))
    ]);

    questions = await questionsResponse.json();
    questions = shuffleArray(questions); // Shuffle questions
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
  drawVisualization(question.id); // Draw the visualization for the current question
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
  const currentQuestion = questions[currentQuestionIndex];
  const questionId = currentQuestion.id;

  votesData[questionId] = votesData[questionId] || {
    above: 0,
    below: 0,
    text: currentQuestion.text // Add question text to votesData
  };

  if (isAbove) {
    votesData[questionId].above++;
  } else {
    votesData[questionId].below++;
  }

  // Update Firebase with the new votesData
  update(ref(db, "votes"), { [questionId]: votesData[questionId] })
    .then(() => {
      currentQuestionIndex++;
      loadQuestion();
    })
    .catch((error) => {
      console.error("Error updating votes:", error);
    });
}

// Draw the abstract visualization on the canvas
function drawVisualization(questionId) {
  const data = votesData[questionId] || { above: 0, below: 0 };
  const totalVotes = data.above + data.below;

  // Reset the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set canvas size
  canvas.width = 500;
  canvas.height = 300;

  // Set the colors for above and below votes
  const aboveColor = '#00e5ff';
  const belowColor = '#f44336';

  // Draw the "Above Average" bar
  const aboveWidth = (data.above / totalVotes) * canvas.width;
  ctx.fillStyle = aboveColor;
  ctx.fillRect(0, 0, aboveWidth, canvas.height / 2);

  // Draw the "Below Average" bar
  const belowWidth = (data.below / totalVotes) * canvas.width;
  ctx.fillStyle = belowColor;
  ctx.fillRect(0, canvas.height / 2, belowWidth, canvas.height / 2);

  // Optionally, add labels or other cool effects
  ctx.fillStyle = '#e0e0e0';
  ctx.font = '20px Arial';
  ctx.fillText(`Above: ${data.above}`, aboveWidth + 10, 40);
  ctx.fillText(`Below: ${data.below}`, belowWidth + 10, canvas.height - 20);
}

// Event listeners for buttons
aboveAverageBtn.onclick = () => handleVote(true);
belowAverageBtn.onclick = () => handleVote(false);

// Initialize app
init();
