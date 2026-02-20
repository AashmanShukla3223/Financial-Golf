from flask import Flask, jsonify, request
from flask_cors import CORS
import math

app = Flask(__name__)
# Restrict CORS specifically to Tauri's local origin
CORS(app, resources={r"/api/*": {"origins": "http://tauri.localhost"}})

@app.route('/api/compound-interest', methods=['POST'])
def calculate_compound_interest():
    data = request.json
    principal = float(data.get('principal', 0))
    rate = float(data.get('rate', 0.05))
    years = int(data.get('years', 10))
    
    # Secure financial calculation
    amount = principal * math.pow((1 + rate), years)
    
    return jsonify({
        "principal": principal,
        "amount_after_years": round(amount, 2),
        "interest_earned": round(amount - principal, 2)
    })

if __name__ == '__main__':
    # Run securely bound ONLY to localhost
    app.run(host='127.0.0.1', port=8082)
