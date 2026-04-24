import os
import json
import threading
import time
import pathlib
import base64
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client
from google import genai

load_dotenv()

# ── IoT / XGBoost prediction setup ───────────────────────────────────────────
try:
    import joblib
    import pandas as pd
    import requests as http_requests
    _MODEL_PATH = pathlib.Path(__file__).parent.parent / 'web' / 'xgb_model_prediction.pkl'
    iot_model = joblib.load(str(_MODEL_PATH))
except Exception as _e:
    iot_model = None

# Serial config — change COM port to match your hardware
SERIAL_PORT = 'COM5'
BAUD_RATE    = 9600
READ_COMMAND = b'\xFF\x01\x86\x00\x00\x00\x00\x00\x79'

iot_state = {
    'count': 0,
    'current_raw': {'PM_1.0': 0, 'PM_2.5': 0, 'PM_10': 0, 'CO2': 0, 'TVOC': 0, 'CH2O': 0.0},
    'is_calibrated': False,
    'final_calibrated_data': None,
    'weekly_forecast': None,
    'error': None
}


def _decode_packet(packet):
    if len(packet) >= 26 and packet[0] == 0xFF and packet[1] == 0x86:
        return {
            'PM_1.0': (packet[2] << 8) | packet[3],
            'PM_2.5': (packet[4] << 8) | packet[5],
            'PM_10':  (packet[6] << 8) | packet[7],
            'CO2':    (packet[8] << 8) | packet[9],
            'TVOC':   (packet[10] << 8) | packet[11],
            'CH2O':   round(((packet[12] << 8) | packet[13]) / 1000.0, 3)
        }
    return None


def _generate_weekly_forecast():
    """Fetch Open-Meteo weather and run XGBoost model for 7-day AQI forecast."""
    global iot_state
    if iot_model is None:
        return
    try:
        url = 'https://api.open-meteo.com/v1/forecast'
        params = {
            'latitude': 27.3064,
            'longitude': 88.3643,
            'daily': ['temperature_2m_max', 'precipitation_sum', 'windspeed_10m_max'],
            'timezone': 'Asia/Kolkata'
        }
        weather_data = http_requests.get(url, params=params, timeout=10).json()['daily']
        base = iot_state['final_calibrated_data']
        forecast_list = []
        for i in range(7):
            current_date = pd.to_datetime(weather_data['time'][i])
            features = pd.DataFrame([{
                'PM2_5':            base['PM_2.5'],
                'PM10':             base['PM_10'],
                'CO':               0.8,
                'NO2':              12.0,
                'temperature':      weather_data['temperature_2m_max'][i],
                'precipitation':    weather_data['precipitation_sum'][i],
                'relative_humidity': 75.0,
                'wind_speed_num':   weather_data['windspeed_10m_max'][i],
                'hours':            current_date.hour,
                'month':            current_date.month,
                'day_of_week':      current_date.dayofweek
            }])
            predicted = iot_model.predict(features)[0].item()
            forecast_list.append({
                'date': current_date.strftime('%A, %b %d'),
                'temp': weather_data['temperature_2m_max'][i],
                'aqi':  round(predicted)
            })
        iot_state['weekly_forecast'] = forecast_list
    except Exception as exc:
        iot_state['weekly_forecast'] = None


def _read_sensor_loop():
    """Background thread: reads IoT sensor over serial, calibrates, then forecasts."""
    global iot_state
    target_readings = []
    while True:
        try:
            import serial
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
            ser.reset_input_buffer()
            iot_state['error'] = None # Clear previous error if reconnected
            while True:
                ser.write(READ_COMMAND)
                time.sleep(0.5)
                if ser.in_waiting >= 26:
                    raw = ser.read(26)
                    data = _decode_packet(raw)
                    ser.reset_input_buffer()
                    if data:
                        iot_state['current_raw'] = data
                        if not iot_state['is_calibrated']:
                            iot_state['count'] += 1
                            if 20 <= iot_state['count'] <= 22:
                                target_readings.append(data)
                            if iot_state['count'] == 22:
                                final = {}
                                for key in target_readings[0]:
                                    final[key] = round(sum(r[key] for r in target_readings) / 3.0, 2)
                                iot_state['final_calibrated_data'] = final
                                iot_state['is_calibrated'] = True
                                threading.Thread(target=_generate_weekly_forecast, daemon=True).start()
                time.sleep(2)
        except Exception as exc:
            iot_state['error'] = str(exc)
            time.sleep(5)  # Wait 5 seconds before retrying


# Start the IoT sensor thread automatically
_sensor_thread = threading.Thread(target=_read_sensor_loop, daemon=True)
_sensor_thread.start()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── Supabase client ──────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Gemini AI client ─────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
client = genai.Client(api_key=GEMINI_API_KEY)

def decode_data(encoded_str):
    """Symmetrically decode Base64 + Caesar shift cipher used by frontend."""
    if not encoded_str: return encoded_str
    try:
        decoded_bytes = base64.b64decode(encoded_str)
        decoded_str = decoded_bytes.decode('utf-8')
        return "".join([chr(ord(c) - 3) for c in decoded_str])
    except Exception:
        return encoded_str

# ── Disease → Specialization mapping ─────────────────────────────────────────
DISEASE_SPECIALIZATION_MAP = {
    'malaria':      'Infectious Disease',
    'dengue':       'Infectious Disease',
    'typhoid':      'Infectious Disease',
    'cholera':      'Gastroenterology',
    'tuberculosis': 'Pulmonology',
    'chickenpox':   'Dermatology',
}


def extract_diseases(records):
    """Extract disease keywords from medical history records."""
    diseases = set()
    all_text = ' '.join(r.get('past_medical_record', '') for r in records).lower()
    for disease in DISEASE_SPECIALIZATION_MAP:
        if disease in all_text:
            diseases.add(disease)
    return list(diseases)


def get_needed_specializations(diseases):
    """Map detected diseases to required specializations."""
    specs = set()
    for d in diseases:
        spec = DISEASE_SPECIALIZATION_MAP.get(d.lower())
        if spec:
            specs.add(spec)
    # Always include General Medicine as fallback
    specs.add('General Medicine')
    return list(specs)


def rank_doctors(doctors, patient_district, patient_city, patient_state):
    """Rank doctors by proximity: same district > same city > same state > rest."""
    def score(doc):
        s = 0
        if doc.get('district', '').lower() == (patient_district or '').lower():
            s += 100
        if doc.get('city', '').lower() == (patient_city or '').lower():
            s += 50
        if doc.get('state', '').lower() == (patient_state or '').lower():
            s += 20
        return s
    return sorted(doctors, key=score, reverse=True)


@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "message": "Horizon Health Backend API is running! Navigate to the Vite frontend (localhost:5173) for the web app."
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Horizon Health API is running."})


@app.route('/api/ai-assistant', methods=['POST'])
def ai_assistant():
    """
    AI Health Assistant endpoint.
    Expects JSON: { aadhar_no: string, question: string }
    Returns: { ai_response: string, recommended_doctors: [], diseases_detected: [] }
    """
    try:
        body = request.get_json(silent=True) or {}
        aadhar_no = body.get('aadhar_no', '').strip()
        question = body.get('question', '').strip()

        if not aadhar_no or not question:
            return jsonify({"error": "Both aadhar_no and question are required."}), 400

        # ── 1. Fetch patient info ─────────────────────────────────────────────
        patient_res = supabase.table('patients').select('*').eq('aadhar_no', aadhar_no).execute()
        if not patient_res.data:
            return jsonify({"error": "Patient not found."}), 404
        patient = patient_res.data[0]

        # ── 2. Fetch medical history ──────────────────────────────────────────
        history_res = supabase.table('medical_history').select('*').eq(
            'patient_aadhar_no', aadhar_no
        ).order('created_at', desc=True).execute()
        records = history_res.data or []

        # ── 3. Extract diseases and find specializations ──────────────────────
        diseases = extract_diseases(records)
        specializations = get_needed_specializations(diseases)

        # ── 4. Fetch matching doctors, ranked by proximity ────────────────────
        top_doctors = []
        try:
            doc_res = supabase.table('doctors').select('*').in_('specialization', specializations).execute()
            all_doctors = doc_res.data or []
            ranked_doctors = rank_doctors(
                all_doctors,
                patient.get('district'),
                patient.get('city'),
                patient.get('state')
            )
            top_doctors = [{
                'name': d['name'],
                'specialization': d.get('specialization', 'General Medicine'),
                'hospital_name': d['hospital_name'],
                'city': d.get('city', ''),
                'state': d.get('state', ''),
                'mobile_no': d.get('mobile_no', '')
            } for d in ranked_doctors[:3]]
        except Exception:
            # Specialization column may not exist yet — fallback to all doctors
            try:
                doc_res = supabase.table('doctors').select('*').execute()
                all_doctors = doc_res.data or []
                ranked_doctors = rank_doctors(
                    all_doctors,
                    patient.get('district'),
                    patient.get('city'),
                    patient.get('state')
                )
                top_doctors = [{
                    'name': d['name'],
                    'specialization': d.get('specialization', 'General Medicine'),
                    'hospital_name': d['hospital_name'],
                    'city': d.get('city', ''),
                    'state': d.get('state', ''),
                    'mobile_no': d.get('mobile_no', '')
                } for d in ranked_doctors[:3]]
            except Exception:
                top_doctors = []

        # ── 5. Build medical context for AI ───────────────────────────────────
        history_text = ""
        for i, r in enumerate(records, 1):
            history_text += (
                f"\nRecord #{i} — Date: {r.get('created_at', 'N/A')}\n"
                f"  Doctor: {r.get('doctor_name', 'Unknown')} at {r.get('hospital_name', 'Unknown')}\n"
                f"  Notes: {r.get('past_medical_record', '')}\n"
                f"  Prescription: {r.get('prescription', 'None')}\n"
            )
        if not history_text:
            history_text = "No previous medical records found."

        diseases_str = ', '.join(d.capitalize() for d in diseases) if diseases else 'None detected'
        doctors_str = '\n'.join(
            f"  - {d['name']} ({d['specialization']}) at {d['hospital_name']}, {d['city']}"
            for d in top_doctors
        ) if top_doctors else "  No specialist doctors found nearby."

        prompt = f"""You are the Horizon Health AI Medical Assistant. You have access to the patient's 
complete medical history below. Your role is to:

1. ANALYZE the patient's question in context of their medical history
2. Provide a TEMPORARY REMEDY (home remedies, OTC medications, lifestyle tips) for immediate relief
3. Clearly state this is TEMPORARY and NOT a replacement for professional medical advice
4. Based on their past diseases ({diseases_str}), recommend they visit a specialist
5. Keep your response concise, warm, and easy to understand
6. Use bullet points for remedies
7. If the question seems unrelated to their history, still provide helpful general advice

PATIENT INFO:
- Name: {patient.get('name', 'Unknown')}
- Location: {patient.get('city', '')}, {patient.get('state', '')}

MEDICAL HISTORY:
{history_text}

DETECTED PAST DISEASES: {diseases_str}

AVAILABLE SPECIALIST DOCTORS NEAR PATIENT:
{doctors_str}

PATIENT'S QUESTION: {question}

Respond in a structured format with:
- A brief greeting acknowledging their history
- The temporary remedy section with bullet points
- A clear recommendation to visit one of the listed specialist doctors
- A medical disclaimer"""

        # ── 6. Call Gemini AI ─────────────────────────────────────────────────
        try:
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            ai_text = response.text
        except Exception as e:
            ai_text = (
                f"I apologize, but I'm unable to process your request right now. "
                f"Based on your medical history showing {diseases_str}, I strongly recommend "
                f"visiting a specialist doctor at the earliest. Please see the recommended doctors below.\n\n"
                f"⚠️ This is a temporary system issue. Please try again later or consult a doctor directly."
            )

        return jsonify({
            "ai_response": ai_text,
            "recommended_doctors": top_doctors,
            "diseases_detected": diseases,
            "patient_name": patient.get('name', 'Unknown')
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "ai_response": "An unexpected error occurred. Please try again.",
            "recommended_doctors": [],
            "diseases_detected": []
        }), 500


@app.route('/api/login/doctor', methods=['POST'])
def doctor_login():
    # Placeholder for future DB integration
    return jsonify({"authenticated": True, "role": "doctor", "token": "temp-doctor-token"})


@app.route('/api/login/patient', methods=['POST'])
def patient_login():
    # Placeholder for future DB integration
    return jsonify({"authenticated": True, "role": "patient", "token": "temp-patient-token"})


@app.route('/api/iot-status', methods=['GET'])
def iot_status():
    """
    Returns the current IoT sensor state including:
      - count / is_calibrated / current_raw readings
      - final_calibrated_data after calibration
      - weekly_forecast (7-day XGBoost AQI predictions)
    """
    return jsonify(iot_state)


@app.route('/api/health-map-ai', methods=['POST'])
def health_map_ai():
    """
    AI Health Map endpoint.
    Expects JSON: { disease: string, city: string, district: string, state: string, cases: number }
    Returns: { ai_prevention: string, nearest_doctor: dict }
    """
    try:
        body = request.get_json(silent=True) or {}
        disease = body.get('disease', '').strip()
        city = body.get('city', '').strip()
        district = body.get('district', '').strip()
        state = body.get('state', '').strip()
        cases = body.get('cases', 0)

        if not disease:
            return jsonify({"error": "Disease name is required."}), 400

        # 1. Find nearest Specialist Doctor
        spec = DISEASE_SPECIALIZATION_MAP.get(disease.lower(), 'General Medicine')
        doc_res = supabase.table('doctors').select('*').in_('specialization', [spec, 'General Medicine']).execute()
        all_doctors = doc_res.data or []
        
        ranked_doctors = rank_doctors(all_doctors, district, city, state)
        
        nearest_doctor = None
        if ranked_doctors:
            best = ranked_doctors[0]
            nearest_doctor = {
                'name': best.get('name', 'Unknown'),
                'specialization': best.get('specialization', spec),
                'hospital_name': best.get('hospital_name', 'Unknown Hospital'),
                'mobile_no': decode_data(best.get('mobile_no', '')),
                'city': best.get('city', ''),
                'state': best.get('state', '')
            }

        # 2. Call Gemini for Prevention & Symptoms
        prompt = f"""You are Horizon Health AI Outbreak Radar. A user has clicked on a map marker for an active outbreak of {disease} in {city}, {state} with {cases} active cases.
Provide a clear, brief, 3-paragraph summary covering:
1. Quick overview of the transmission mechanism.
2. 3-4 bullet points of early symptoms.
3. 3-4 bullet points of urgent prevention measures locals should take.
Keep it strictly informative, concise, and do not hallucinate details."""
        
        try:
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            ai_text = response.text
        except Exception as e:
            ai_text = (
                f"⚠️ Active {disease} outbreak detected locally. Please take immediate precautions:\n\n"
                f"• Avoid crowded areas and consider wearing a mask if respiratory.\n"
                f"• Maintain strict hygiene; thoroughly wash hands and consume properly cooked food.\n"
                f"• Ensure your surroundings are clean to prevent vector-borne transmission.\n\n"
                f"Please consult the nearest recommended specialist below immediately for professional diagnosis if you show symptoms."
            )

        return jsonify({
            "ai_prevention": ai_text,
            "nearest_doctor": nearest_doctor
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
