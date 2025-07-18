// -------------------------------------------
// JavaScript for dynamic background image slideshow
// -------------------------------------------
const images = [
  // Paths to your background images. Ensure these paths are correct relative to your HTML file.
  // Assuming a Flask static setup: static/images/
  "static/images/img1.jpg", "static/images/img2.jpeg", "static/images/img3.jpeg",
  "static/images/img4.jpeg", "static/images/img5.jpeg", "static/images/img6.jpeg",
  "static/images/img7.jpeg", "static/images/img8.jpeg", "static/images/img9.jpeg",
  "static/images/img10.jpeg", "static/images/img11.jpeg"
];

let imageIndex = 0; // Keeps track of the current image being displayed
const bgDiv = document.getElementById("bg"); // Get the background div element

/**
 * Changes the background image of the 'bgDiv' to the next image in the 'images' array.
 * Loops back to the start of the array when it reaches the end.
 */
function changeBackground() {
  // Set the background image using a template literal for easy URL insertion
  bgDiv.style.backgroundImage = `url('${images[imageIndex]}')`;
  // Move to the next image, or loop back to 0 if at the end
  imageIndex = (imageIndex + 1) % images.length;
}

// Call changeBackground immediately to set the first image when the page loads
changeBackground();

// Set an interval to change the background every 2 seconds (2000 milliseconds)
setInterval(changeBackground, 5000);

// -------------------------------------------
// Original JavaScript for IPL Predictor (with minor updates)
// -------------------------------------------

// Define the list of IPL teams and cities, sorted alphabetically for dropdowns
const teams = ['KKR', 'SRH', 'CSK', 'DC', 'GT', 'RR', 'MI', 'LSG', 'RCB', 'PBKS'].sort();
const cities = ['Kolkata', 'Hyderabad', 'Chennai', 'Vishakhapatnam', 'Ahmedabad',
   'Guwahati', 'Mumbai', 'Lucknow', 'Bangalore', 'Mullanpur',
   'Jaipur', 'Delhi', 'Dharamsala', 'Pune', 'Dubai ',
   'Sharjah', 'Abu Dhabi', 'Indore', 'Raipur', 'Ranchi', 'Cuttack',
   'Nagpur', 'Cape Town', 'Port Elizabeth', 'Durban', 'Centurion',
   'East London', 'Johannesburg', 'Kimberley', 'Bloemfontein'].sort();

/**
 * Populates the team and city dropdowns with options.
 * This function is called when the page loads.
 */
function populateOptions() {
  const battingTeamSelect = document.getElementById("batting_team");
  const bowlingTeamSelect = document.getElementById("bowling_team");
  const citySelect = document.getElementById("city");

  // Create a default disabled and selected option for dropdowns
  const defaultOption = '<option value="" disabled selected>Select an option</option>';
  battingTeamSelect.innerHTML = defaultOption;
  bowlingTeamSelect.innerHTML = defaultOption;
  citySelect.innerHTML = defaultOption;

  // Populate team dropdowns with sorted teams
  teams.forEach(team => {
    const option = `<option value="${team}">${team}</option>`;
    battingTeamSelect.innerHTML += option;
    bowlingTeamSelect.innerHTML += option;
  });

  // Populate city dropdown with sorted cities
  cities.forEach(city => {
    citySelect.innerHTML += `<option value="${city}">${city}</option>`;
  });
}

/**
 * Displays a message to the user in the result div, styling it as an error or success message.
 * @param {string} message - The message to display.
 * @param {boolean} isError - True if the message is an error, false otherwise.
 */
function displayMessage(message, isError) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = message; // Set the message content
  // Apply appropriate CSS class based on whether it's an error
  resultDiv.className = isError ? 'error-message' : 'result-display';
}

/**
 * Gathers form data, performs client-side validation, and sends a prediction request
 * to the backend API. Displays the results or any errors.
 */
async function predict() {
  // Gather all input data from the form fields
  const data = {
    batting_team: document.getElementById("batting_team").value,
    bowling_team: document.getElementById("bowling_team").value,
    city: document.getElementById("city").value,
    target: parseInt(document.getElementById("target").value),
    score: parseInt(document.getElementById("score").value),
    wickets: parseInt(document.getElementById("wickets").value),
    overs: parseFloat(document.getElementById("overs").value)
  };

  // --- Client-side Validation ---
  if (!data.batting_team || !data.bowling_team || !data.city) {
    displayMessage("Please select both teams and a city.", true);
    return; // Stop execution if validation fails
  }

  // Check if any numerical field is not a valid number (NaN)
  if ([data.target, data.score, data.wickets, data.overs].some(isNaN)) {
    displayMessage("All numerical fields must be filled with valid numbers.", true);
    return;
  }

  // Validate wickets range (0 to 9)
  if (data.wickets < 0 || data.wickets > 9) {
    displayMessage("Wickets must be between 0 and 9.", true);
    return;
  }

  // Validate overs range (0 to 20) and format (X.0 to X.5)
  // The (data.overs % 1 >= 0.6) checks if the decimal part is .6 or higher
  if (data.overs < 0 || data.overs > 20 || (data.overs % 1 >= 0.6)) {
    displayMessage("Overs should be between 0 and 20 and formatted as X.0 to X.5 (e.g., 12.3).", true);
    return;
  }

  // Ensure batting and bowling teams are different
  if (data.batting_team === data.bowling_team) {
    displayMessage("Batting and bowling teams must be different.", true);
    return;
  }

  // Display a "Predicting..." message while waiting for the API response
  displayMessage("Predicting...", false);

  try {
    // Send a POST request to the Flask backend's /predict endpoint
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data) // Send input data as JSON
    });

    const result = await response.json(); // Parse the JSON response from the backend

    if (response.ok) {
      // If the response is successful, display the predicted probabilities
      displayMessage(
        `<span class="text-green-700">${data.batting_team}</span>: ${result.batting_team_prob}%<br>
         <span class="text-blue-700">${data.bowling_team}</span>: ${result.bowling_team_prob}%`, false
      );
    } else {
      // If there's an error from the backend, display it
      displayMessage(`Error: ${result.error || 'Unknown server error'}.`, true);
    }
  } catch (err) {
    // Catch network errors or other issues during the fetch operation
    console.error("Fetch error:", err); // Log the error for debugging
    displayMessage("Failed to connect to the prediction server. Please ensure the backend is running.", true);
  }
}

// Ensure dropdowns are populated when the window finishes loading
window.onload = populateOptions;
