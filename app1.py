# Import necessary libraries
import pickle
from flask import Flask, request, jsonify, render_template # Import render_template
from flask_cors import CORS
import numpy as np
import pandas as pd

app = Flask(__name__)
CORS(app)

# Define the path to your pickle file
PICKLE_FILE_PATH = 'pipe.pkl'

# Load the machine learning model
model = None
try:
    with open(PICKLE_FILE_PATH, 'rb') as file:
        model = pickle.load(file)
    print(f"Model loaded successfully from {PICKLE_FILE_PATH}")
except FileNotFoundError:
    print(f"Error: '{PICKLE_FILE_PATH}' not found. Please ensure the model file is in the same directory.")
except Exception as e:
    print(f"An error occurred while loading the model: {e}")

@app.route('/')
def home():
    """
    Root endpoint for the Flask application.
    Serves the index.html Jinja template.
    """
    # Render the index.html template. Jinja will automatically look in the 'templates' folder.
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """
    Receives cricket match details via a POST request,
    uses the loaded ML model to predict winning percentages,
    and returns the probabilities as JSON.

    Expected JSON input:
    {
        "batting_team": "Team A",
        "bowling_team": "Team B",
        "city": "Venue City",
        "target": 180,
        "score": 120,
        "wickets": 3,
        "overs": 12.5
    }
    """
    # Check if the model was loaded successfully
    if model is None:
        return jsonify({"error": "Prediction model not loaded. Please check backend logs."}), 500

    try:
        # Get JSON data from the request body
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided in the request body."}), 400

        # Extract data points from the JSON payload
        batting_team = data.get('batting_team')
        bowling_team = data.get('bowling_team')
        city = data.get('city')
        target_score = data.get('target')
        current_score = data.get('score')
        wickets = data.get('wickets')
        overs_completed = data.get('overs')

        # Basic validation for required fields and types
        if not all([batting_team, bowling_team, city,
                    target_score is not None, current_score is not None,
                    wickets is not None, overs_completed is not None]):
            return jsonify({"error": "Missing one or more required input fields."}), 400

        try:
            target_score = int(target_score)
            current_score = int(current_score)
            wickets = int(wickets)
            overs_completed = float(overs_completed)
        except ValueError:
            return jsonify({"error": "Invalid data type for numerical fields. Please provide valid numbers."}), 400

        # --- Feature Engineering based on the Streamlit app's logic ---
        runs_left = target_score - current_score
        balls_left = 120 - (overs_completed * 6)

        crr = current_score / overs_completed if overs_completed > 0 else 0
        rrr = (runs_left * 6) / balls_left if balls_left > 0 else (runs_left * 6)

        # Construct the DataFrame for the model
        input_df = pd.DataFrame([[
            batting_team,
            bowling_team,
            city,
            runs_left,
            balls_left,
            wickets, # Wickets fallen
            target_score, # This is 'total_runs_x'
            crr,
            rrr
        ]], columns=[
            'batting_team', 'bowling_team', 'city', 'runs_left', 'balls_left',
            'wickets', 'total_runs_x', 'crr', 'rrr'
        ])

        # Predict winning probabilities
        probabilities = model.predict_proba(input_df)[0]

        batting_team_prob = round(probabilities[1] * 100, 2)
        bowling_team_prob = round(probabilities[0] * 100, 2)

        # Return the results as JSON
        return jsonify({
            "batting_team_prob": batting_team_prob,
            "bowling_team_prob": bowling_team_prob
        })

    except Exception as e:
        print(f"An error occurred during prediction: {e}")
        return jsonify({"error": f"An unexpected error occurred during prediction: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
