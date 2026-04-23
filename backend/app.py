from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Horizon Health Backend API is running! Please navigate to the Vite frontend server (usually localhost:5173) to see the web page."})


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Horizon Health API is running."})

@app.route('/api/login/doctor', methods=['POST'])
def doctor_login():
    # Placeholder for future DB integration
    return jsonify({"authenticated": True, "role": "doctor", "token": "temp-doctor-token"})

@app.route('/api/login/patient', methods=['POST'])
def patient_login():
    # Placeholder for future DB integration
    return jsonify({"authenticated": True, "role": "patient", "token": "temp-patient-token"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
