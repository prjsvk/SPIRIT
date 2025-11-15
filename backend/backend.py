from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# Get the API key from environment variable
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY not set in environment!")


# Configure the Gemini client with API key
genai.configure(api_key=api_key)

# Initialize the model
model = genai.GenerativeModel("gemini-2.5-flash")

@app.route('/generate', methods=['GET'])
def generate():
    prompt = request.args.get('prompt', '')
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400
    try:
        response = model.generate_content(prompt)
        return jsonify({'response': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'messages' not in data:
        return jsonify({'error': 'Messages are required'}), 400

    messages = data['messages']
    try:
        # Convert messages to a single prompt
        prompt = ' '.join([msg.get('content', str(msg)) for msg in messages])
        response = model.generate_content(prompt)
        return jsonify({'response': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
