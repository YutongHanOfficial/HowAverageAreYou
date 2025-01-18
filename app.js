import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQ5_pbAH7nGM2ACJ1gJGOvBKdSJ2nmCIY",
  authDomain: "how-average-are-you-a6486.firebaseapp.com",
  databaseURL: "https://how-average-are-you-a6486-default-rtdb.firebaseio.com",
  projectId: "how-average-are-you-a6486",
  storageBucket: "how-average-are-you-a6486.appspot.com",
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
const chartDiv = document.getElementById("chart");

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

// Create bubble chart using D3.js
function renderChart(data) {
  chartDiv.innerHTML = ""; // Clear previous chart
  const width = 600;
  const height = 400;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const colorScale = d3.scaleOrdinal()
    .domain(["above", "below"])
    .range(["#4caf50", "#ff5252"]);

  const radiusScale = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.value)])
    .range([10, 50]);

  const simulation = d3.forceSimulation(data)
    .force("charge", d3.forceManyBody().strength(5))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide(d => radiusScale(d.value) + 5))
    .on("tick", ticked);

  function ticked() {
    const circles = svg.selectAll("circle").data(data);

    circles.enter()
      .append("circle")
      .attr("r", d => radiusScale(d.value))
      .attr("fill", d => colorScale(d.type))
      .merge(circles)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    circles.exit().remove();
  }
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
}

// Update stats for the current question
function updateStats(questionId) {
  const data = votesData[questionId] || { above: 0, below: 0 };
  const totalVotes = data.above + data.below;

  const chartData = [
    { type: "above", value: data.above },
    { type: "below", value: data.below }
  ];

  renderChart(chartData);

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
    text: currentQuestion.text
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

// Event listeners for buttons
aboveAverageBtn.onclick = () => handleVote(true);
belowAverageBtn.onclick = () => handleVote(false);

// Initialize app
init();
