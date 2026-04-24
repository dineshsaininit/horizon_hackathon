-- Database Schema
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    aadhar_no TEXT UNIQUE NOT NULL,
    mobile_no TEXT NOT NULL,
    password TEXT NOT NULL,
    city TEXT,
    district TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    hospital_name TEXT NOT NULL,
    specialization TEXT,
    aadhar_no TEXT UNIQUE NOT NULL,
    mobile_no TEXT NOT NULL,
    password TEXT NOT NULL,
    city TEXT,
    district TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name TEXT NOT NULL,
    patient_aadhar_no TEXT NOT NULL,
    doctor_aadhar_no TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    hospital_name TEXT NOT NULL,
    past_medical_record TEXT,
    prescription TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Reset Data
TRUNCATE TABLE patients CASCADE;
TRUNCATE TABLE doctors CASCADE;
TRUNCATE TABLE medical_history CASCADE;
TRUNCATE TABLE medicines CASCADE;

-- Default Medicines Seed
INSERT INTO medicines (name) VALUES 
('Paracetamol 500mg'), ('Amoxicillin 500mg'), ('Ibuprofen 400mg'), ('Cetirizine 10mg'), 
('Azithromycin 500mg'), ('Omeprazole 20mg'), ('Pantoprazole 40mg'), ('Metformin 500mg'), 
('Amlodipine 5mg'), ('Atorvastatin 10mg'), ('Levothyroxine 50mcg'), ('Losartan 50mg'), 
('Vitamin D3 60K'), ('B-Complex Forte'), ('Vitamin C 500mg')
ON CONFLICT (name) DO NOTHING;

-- Seed Doctors
INSERT INTO doctors (name, hospital_name, specialization, aadhar_no, mobile_no, password, city, district, state) VALUES
('Suresh Gupta', 'Apollo Delhi', 'Cardiology', 'NDU2Nzg5Ojs8NDMz', 'Ozo5PDk7NDQ5Og==', 'Z3Jmd3J1NDU2', 'New Delhi', 'New Delhi', 'Delhi'),
('Priya Menon', 'Fortis Mumbai', 'Neurology', 'NDU2Nzg5Ojs8NDM0', 'PDs6OTg3NjU0Og==', 'Z3Jmd3J1NDU2', 'Mumbai', 'Mumbai', 'Maharashtra'),
('Vikram Rathore', 'Manipal Bangalore', 'Orthopedics', 'NDU2Nzg5Ojs8NDM1', 'PDs6OTg3NjU0NA==', 'Z3Jmd3J1NDU2', 'Bangalore', 'Bangalore Urban', 'Karnataka'),
('Anjali Verma', 'AIIMS Delhi', 'Pediatrics', 'NDU2Nzg5Ojs8NDM2', 'PDs6OTg3NjU0NQ==', 'Z3Jmd3J1NDU2', 'New Delhi', 'New Delhi', 'Delhi'),
('Rajesh Kumar', 'Apollo Chennai', 'General Medicine', 'NDU2Nzg5Ojs8NDM3', 'PDs6OTg3NjU0NA==', 'Z3Jmd3J1NDU2', 'Chennai', 'Chennai', 'Tamil Nadu');

-- Seed Patients
INSERT INTO patients (name, aadhar_no, mobile_no, password, city, district, state) VALUES
('Aarav Sharma', 'NDU2Nzg5Ojs8NTMz', 'Ozo5PDk7NDQ5Og==', 'c2R3bGhxdzQ1Ng==', 'New Delhi', 'New Delhi', 'Delhi'),
('Diya Patel', 'NDU2Nzg5Ojs8NTM0', 'PDs6OTg3NjwzNA==', 'c2R3bGhxdzQ1Ng==', 'Mumbai', 'Mumbai', 'Maharashtra'),
('Vihaan Singh', 'NDU2Nzg5Ojs8NTM1', 'PDs6OTg3NjwzNQ==', 'c2R3bGhxdzQ1Ng==', 'Bangalore', 'Bangalore Urban', 'Karnataka'),
('Ananya Reddy', 'NDU2Nzg5Ojs8NTM2', 'PDs6OTg3NjwzNg==', 'c2R3bGhxdzQ1Ng==', 'Chennai', 'Chennai', 'Tamil Nadu'),
('Arjun Nair', 'NDU2Nzg5Ojs8NTM3', 'PDs6OTg3NjwzNw==', 'c2R3bGhxdzQ1Ng==', 'Kolkata', 'Kolkata', 'West Bengal'),
('Ishita Gupta', 'NDU2Nzg5Ojs8NTM4', 'PDs6OTg3NjwzOA==', 'c2R3bGhxdzQ1Ng==', 'Pune', 'Pune', 'Maharashtra'),
('Rohan Iyer', 'NDU2Nzg5Ojs8NTM5', 'PDs6OTg3NjwzOQ==', 'c2R3bGhxdzQ1Ng==', 'Hyderabad', 'Hyderabad', 'Telangana'),
('Meera Desai', 'NDU2Nzg5Ojs8NTM6', 'PDs6OTg3NjwzOg==', 'c2R3bGhxdzQ1Ng==', 'Ahmedabad', 'Ahmedabad', 'Gujarat'),
('Aarav Sharma 8', 'NDU2Nzg5Ojs8NTM7', 'PDs6OTg3NjwzOw==', 'c2R3bGhxdzQ1Ng==', 'New Delhi', 'New Delhi', 'Delhi'),
('Diya Patel 9', 'NDU2Nzg5Ojs8NTM8', 'PDs6OTg3NjwzPA==', 'c2R3bGhxdzQ1Ng==', 'Mumbai', 'Mumbai', 'Maharashtra'),
('Vihaan Singh 10', 'NDU2Nzg5Ojs8NTQz', 'PDs6OTg3Njw0Mw==', 'c2R3bGhxdzQ1Ng==', 'Bangalore', 'Bangalore Urban', 'Karnataka'),
('Ananya Reddy 11', 'NDU2Nzg5Ojs8NTQ0', 'PDs6OTg3Njw0NA==', 'c2R3bGhxdzQ1Ng==', 'Chennai', 'Chennai', 'Tamil Nadu'),
('Arjun Nair 12', 'NDU2Nzg5Ojs8NTQ1', 'PDs6OTg3Njw0NQ==', 'c2R3bGhxdzQ1Ng==', 'Kolkata', 'Kolkata', 'West Bengal'),
('Ishita Gupta 13', 'NDU2Nzg5Ojs8NTQ2', 'PDs6OTg3Njw0Ng==', 'c2R3bGhxdzQ1Ng==', 'Pune', 'Pune', 'Maharashtra'),
('Rohan Iyer 14', 'NDU2Nzg5Ojs8NTQ3', 'PDs6OTg3Njw0Nw==', 'c2R3bGhxdzQ1Ng==', 'Hyderabad', 'Hyderabad', 'Telangana'),
('Meera Desai 15', 'NDU2Nzg5Ojs8NTQ4', 'PDs6OTg3Njw0OA==', 'c2R3bGhxdzQ1Ng==', 'Ahmedabad', 'Ahmedabad', 'Gujarat'),
('Aarav Sharma 16', 'NDU2Nzg5Ojs8NTQ5', 'PDs6OTg3Njw0OQ==', 'c2R3bGhxdzQ1Ng==', 'New Delhi', 'New Delhi', 'Delhi'),
('Diya Patel 17', 'NDU2Nzg5Ojs8NTQ6', 'PDs6OTg3Njw0Og==', 'c2R3bGhxdzQ1Ng==', 'Mumbai', 'Mumbai', 'Maharashtra'),
('Vihaan Singh 18', 'NDU2Nzg5Ojs8NTQ7', 'PDs6OTg3Njw0Ow==', 'c2R3bGhxdzQ1Ng==', 'Bangalore', 'Bangalore Urban', 'Karnataka'),
('Ananya Reddy 19', 'NDU2Nzg5Ojs8NTQ8', 'PDs6OTg3Njw0PA==', 'c2R3bGhxdzQ1Ng==', 'Chennai', 'Chennai', 'Tamil Nadu'),
('Arjun Nair 20', 'NDU2Nzg5Ojs8NTUz', 'PDs6OTg3Njw1Mw==', 'c2R3bGhxdzQ1Ng==', 'Kolkata', 'Kolkata', 'West Bengal'),
('Ishita Gupta 21', 'NDU2Nzg5Ojs8NTU0', 'PDs6OTg3Njw1NA==', 'c2R3bGhxdzQ1Ng==', 'Pune', 'Pune', 'Maharashtra'),
('Rohan Iyer 22', 'NDU2Nzg5Ojs8NTU1', 'PDs6OTg3Njw1NQ==', 'c2R3bGhxdzQ1Ng==', 'Hyderabad', 'Hyderabad', 'Telangana'),
('Meera Desai 23', 'NDU2Nzg5Ojs8NTU2', 'PDs6OTg3Njw1Ng==', 'c2R3bGhxdzQ1Ng==', 'Ahmedabad', 'Ahmedabad', 'Gujarat'),
('Aarav Sharma 24', 'NDU2Nzg5Ojs8NTU3', 'PDs6OTg3Njw1Nw==', 'c2R3bGhxdzQ1Ng==', 'New Delhi', 'New Delhi', 'Delhi'),
('Diya Patel 25', 'NDU2Nzg5Ojs8NTU4', 'PDs6OTg3Njw1OA==', 'c2R3bGhxdzQ1Ng==', 'Mumbai', 'Mumbai', 'Maharashtra'),
('Vihaan Singh 26', 'NDU2Nzg5Ojs8NTU5', 'PDs6OTg3Njw1OQ==', 'c2R3bGhxdzQ1Ng==', 'Bangalore', 'Bangalore Urban', 'Karnataka'),
('Ananya Reddy 27', 'NDU2Nzg5Ojs8NTU6', 'PDs6OTg3Njw1Og==', 'c2R3bGhxdzQ1Ng==', 'Chennai', 'Chennai', 'Tamil Nadu'),
('Arjun Nair 28', 'NDU2Nzg5Ojs8NTU7', 'PDs6OTg3Njw1Ow==', 'c2R3bGhxdzQ1Ng==', 'Kolkata', 'Kolkata', 'West Bengal'),
('Ishita Gupta 29', 'NDU2Nzg5Ojs8NTU8', 'PDs6OTg3Njw1PA==', 'c2R3bGhxdzQ1Ng==', 'Pune', 'Pune', 'Maharashtra'),
('Rohan Iyer 30', 'NDU2Nzg5Ojs8NTYz', 'PDs6OTg3Njw2Mw==', 'c2R3bGhxdzQ1Ng==', 'Hyderabad', 'Hyderabad', 'Telangana'),
('Meera Desai 31', 'NDU2Nzg5Ojs8NTY0', 'PDs6OTg3Njw2NA==', 'c2R3bGhxdzQ1Ng==', 'Ahmedabad', 'Ahmedabad', 'Gujarat'),
('Aarav Sharma 32', 'NDU2Nzg5Ojs8NTY1', 'PDs6OTg3Njw2NQ==', 'c2R3bGhxdzQ1Ng==', 'New Delhi', 'New Delhi', 'Delhi'),
('Diya Patel 33', 'NDU2Nzg5Ojs8NTY2', 'PDs6OTg3Njw2Ng==', 'c2R3bGhxdzQ1Ng==', 'Mumbai', 'Mumbai', 'Maharashtra'),
('Vihaan Singh 34', 'NDU2Nzg5Ojs8NTY3', 'PDs6OTg3Njw2Nw==', 'c2R3bGhxdzQ1Ng==', 'Bangalore', 'Bangalore Urban', 'Karnataka'),
('Ananya Reddy 35', 'NDU2Nzg5Ojs8NTY4', 'PDs6OTg3Njw2OA==', 'c2R3bGhxdzQ1Ng==', 'Chennai', 'Chennai', 'Tamil Nadu'),
('Arjun Nair 36', 'NDU2Nzg5Ojs8NTY5', 'PDs6OTg3Njw2OQ==', 'c2R3bGhxdzQ1Ng==', 'Kolkata', 'Kolkata', 'West Bengal'),
('Ishita Gupta 37', 'NDU2Nzg5Ojs8NTY6', 'PDs6OTg3Njw2Og==', 'c2R3bGhxdzQ1Ng==', 'Pune', 'Pune', 'Maharashtra'),
('Rohan Iyer 38', 'NDU2Nzg5Ojs8NTY7', 'PDs6OTg3Njw2Ow==', 'c2R3bGhxdzQ1Ng==', 'Hyderabad', 'Hyderabad', 'Telangana'),
('Meera Desai 39', 'NDU2Nzg5Ojs8NTY8', 'PDs6OTg3Njw2PA==', 'c2R3bGhxdzQ1Ng==', 'Ahmedabad', 'Ahmedabad', 'Gujarat'),
('Aarav Sharma 40', 'NDU2Nzg5Ojs8NTcz', 'PDs6OTg3Njw3Mw==', 'c2R3bGhxdzQ1Ng==', 'New Delhi', 'New Delhi', 'Delhi'),
('Diya Patel 41', 'NDU2Nzg5Ojs8NTc0', 'PDs6OTg3Njw3NA==', 'c2R3bGhxdzQ1Ng==', 'Mumbai', 'Mumbai', 'Maharashtra'),
('Vihaan Singh 42', 'NDU2Nzg5Ojs8NTc1', 'PDs6OTg3Njw3NQ==', 'c2R3bGhxdzQ1Ng==', 'Bangalore', 'Bangalore Urban', 'Karnataka'),
('Ananya Reddy 43', 'NDU2Nzg5Ojs8NTc2', 'PDs6OTg3Njw3Ng==', 'c2R3bGhxdzQ1Ng==', 'Chennai', 'Chennai', 'Tamil Nadu'),
('Arjun Nair 44', 'NDU2Nzg5Ojs8NTc3', 'PDs6OTg3Njw3Nw==', 'c2R3bGhxdzQ1Ng==', 'Kolkata', 'Kolkata', 'West Bengal'),
('Ishita Gupta 45', 'NDU2Nzg5Ojs8NTc4', 'PDs6OTg3Njw3OA==', 'c2R3bGhxdzQ1Ng==', 'Pune', 'Pune', 'Maharashtra'),
('Rohan Iyer 46', 'NDU2Nzg5Ojs8NTc5', 'PDs6OTg3Njw3OQ==', 'c2R3bGhxdzQ1Ng==', 'Hyderabad', 'Hyderabad', 'Telangana'),
('Meera Desai 47', 'NDU2Nzg5Ojs8NTc6', 'PDs6OTg3Njw3Og==', 'c2R3bGhxdzQ1Ng==', 'Ahmedabad', 'Ahmedabad', 'Gujarat'),
('Aarav Sharma 48', 'NDU2Nzg5Ojs8NTc7', 'PDs6OTg3Njw3Ow==', 'c2R3bGhxdzQ1Ng==', 'New Delhi', 'New Delhi', 'Delhi'),
('Diya Patel 49', 'NDU2Nzg5Ojs8NTc8', 'PDs6OTg3Njw3PA==', 'c2R3bGhxdzQ1Ng==', 'Mumbai', 'Mumbai', 'Maharashtra');

-- Seed Medical History
INSERT INTO medical_history (patient_name, patient_aadhar_no, doctor_aadhar_no, doctor_name, hospital_name, past_medical_record, prescription) VALUES
('Aarav Sharma', 'NDU2Nzg5Ojs8NTMz', 'NDU2Nzg5Ojs8NDMz', 'Suresh Gupta', 'Apollo Delhi', 'Patient presented with symptoms of Viral Fever. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.347Z"}]'),
('Diya Patel', 'NDU2Nzg5Ojs8NTM0', 'NDU2Nzg5Ojs8NDM0', 'Priya Menon', 'Fortis Mumbai', 'Patient presented with symptoms of Dengue. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.348Z"}]'),
('Vihaan Singh', 'NDU2Nzg5Ojs8NTM1', 'NDU2Nzg5Ojs8NDM1', 'Vikram Rathore', 'Manipal Bangalore', 'Patient presented with symptoms of Typhoid. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.348Z"}]'),
('Ananya Reddy', 'NDU2Nzg5Ojs8NTM2', 'NDU2Nzg5Ojs8NDM2', 'Anjali Verma', 'AIIMS Delhi', 'Patient presented with symptoms of Malaria. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.348Z"}]'),
('Arjun Nair', 'NDU2Nzg5Ojs8NTM3', 'NDU2Nzg5Ojs8NDM3', 'Rajesh Kumar', 'Apollo Chennai', 'Patient presented with symptoms of COVID-19. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.348Z"}]'),
('Ishita Gupta', 'NDU2Nzg5Ojs8NTM4', 'NDU2Nzg5Ojs8NDMz', 'Suresh Gupta', 'Apollo Delhi', 'Patient presented with symptoms of Hypertension. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.348Z"}]'),
('Rohan Iyer', 'NDU2Nzg5Ojs8NTM5', 'NDU2Nzg5Ojs8NDM0', 'Priya Menon', 'Fortis Mumbai', 'Patient presented with symptoms of Diabetes Type 2. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.348Z"}]'),
('Meera Desai', 'NDU2Nzg5Ojs8NTM6', 'NDU2Nzg5Ojs8NDM1', 'Vikram Rathore', 'Manipal Bangalore', 'Patient presented with symptoms of Asthma. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.348Z"}]'),
('Aarav Sharma 8', 'NDU2Nzg5Ojs8NTM7', 'NDU2Nzg5Ojs8NDM2', 'Anjali Verma', 'AIIMS Delhi', 'Patient presented with symptoms of Migraine. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.348Z"}]'),
('Diya Patel 9', 'NDU2Nzg5Ojs8NTM8', 'NDU2Nzg5Ojs8NDM3', 'Rajesh Kumar', 'Apollo Chennai', 'Patient presented with symptoms of Gastroenteritis. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Vihaan Singh 10', 'NDU2Nzg5Ojs8NTQz', 'NDU2Nzg5Ojs8NDMz', 'Suresh Gupta', 'Apollo Delhi', 'Patient presented with symptoms of Viral Fever. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Ananya Reddy 11', 'NDU2Nzg5Ojs8NTQ0', 'NDU2Nzg5Ojs8NDM0', 'Priya Menon', 'Fortis Mumbai', 'Patient presented with symptoms of Dengue. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Arjun Nair 12', 'NDU2Nzg5Ojs8NTQ1', 'NDU2Nzg5Ojs8NDM1', 'Vikram Rathore', 'Manipal Bangalore', 'Patient presented with symptoms of Typhoid. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Ishita Gupta 13', 'NDU2Nzg5Ojs8NTQ2', 'NDU2Nzg5Ojs8NDM2', 'Anjali Verma', 'AIIMS Delhi', 'Patient presented with symptoms of Malaria. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Rohan Iyer 14', 'NDU2Nzg5Ojs8NTQ3', 'NDU2Nzg5Ojs8NDM3', 'Rajesh Kumar', 'Apollo Chennai', 'Patient presented with symptoms of COVID-19. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Meera Desai 15', 'NDU2Nzg5Ojs8NTQ4', 'NDU2Nzg5Ojs8NDMz', 'Suresh Gupta', 'Apollo Delhi', 'Patient presented with symptoms of Hypertension. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Aarav Sharma 16', 'NDU2Nzg5Ojs8NTQ5', 'NDU2Nzg5Ojs8NDM0', 'Priya Menon', 'Fortis Mumbai', 'Patient presented with symptoms of Diabetes Type 2. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Diya Patel 17', 'NDU2Nzg5Ojs8NTQ6', 'NDU2Nzg5Ojs8NDM1', 'Vikram Rathore', 'Manipal Bangalore', 'Patient presented with symptoms of Asthma. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Vihaan Singh 18', 'NDU2Nzg5Ojs8NTQ7', 'NDU2Nzg5Ojs8NDM2', 'Anjali Verma', 'AIIMS Delhi', 'Patient presented with symptoms of Migraine. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Ananya Reddy 19', 'NDU2Nzg5Ojs8NTQ8', 'NDU2Nzg5Ojs8NDM3', 'Rajesh Kumar', 'Apollo Chennai', 'Patient presented with symptoms of Gastroenteritis. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Arjun Nair 20', 'NDU2Nzg5Ojs8NTUz', 'NDU2Nzg5Ojs8NDMz', 'Suresh Gupta', 'Apollo Delhi', 'Patient presented with symptoms of Viral Fever. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Ishita Gupta 21', 'NDU2Nzg5Ojs8NTU0', 'NDU2Nzg5Ojs8NDM0', 'Priya Menon', 'Fortis Mumbai', 'Patient presented with symptoms of Dengue. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Rohan Iyer 22', 'NDU2Nzg5Ojs8NTU1', 'NDU2Nzg5Ojs8NDM1', 'Vikram Rathore', 'Manipal Bangalore', 'Patient presented with symptoms of Typhoid. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Meera Desai 23', 'NDU2Nzg5Ojs8NTU2', 'NDU2Nzg5Ojs8NDM2', 'Anjali Verma', 'AIIMS Delhi', 'Patient presented with symptoms of Malaria. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Aarav Sharma 24', 'NDU2Nzg5Ojs8NTU3', 'NDU2Nzg5Ojs8NDM3', 'Rajesh Kumar', 'Apollo Chennai', 'Patient presented with symptoms of COVID-19. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Diya Patel 25', 'NDU2Nzg5Ojs8NTU4', 'NDU2Nzg5Ojs8NDMz', 'Suresh Gupta', 'Apollo Delhi', 'Patient presented with symptoms of Hypertension. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Vihaan Singh 26', 'NDU2Nzg5Ojs8NTU5', 'NDU2Nzg5Ojs8NDM0', 'Priya Menon', 'Fortis Mumbai', 'Patient presented with symptoms of Diabetes Type 2. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Ananya Reddy 27', 'NDU2Nzg5Ojs8NTU6', 'NDU2Nzg5Ojs8NDM1', 'Vikram Rathore', 'Manipal Bangalore', 'Patient presented with symptoms of Asthma. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Arjun Nair 28', 'NDU2Nzg5Ojs8NTU7', 'NDU2Nzg5Ojs8NDM2', 'Anjali Verma', 'AIIMS Delhi', 'Patient presented with symptoms of Migraine. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Ishita Gupta 29', 'NDU2Nzg5Ojs8NTU8', 'NDU2Nzg5Ojs8NDM3', 'Rajesh Kumar', 'Apollo Chennai', 'Patient presented with symptoms of Gastroenteritis. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Rohan Iyer 30', 'NDU2Nzg5Ojs8NTYz', 'NDU2Nzg5Ojs8NDMz', 'Suresh Gupta', 'Apollo Delhi', 'Patient presented with symptoms of Viral Fever. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Meera Desai 31', 'NDU2Nzg5Ojs8NTY0', 'NDU2Nzg5Ojs8NDM0', 'Priya Menon', 'Fortis Mumbai', 'Patient presented with symptoms of Dengue. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Aarav Sharma 32', 'NDU2Nzg5Ojs8NTY1', 'NDU2Nzg5Ojs8NDM1', 'Vikram Rathore', 'Manipal Bangalore', 'Patient presented with symptoms of Typhoid. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Diya Patel 33', 'NDU2Nzg5Ojs8NTY2', 'NDU2Nzg5Ojs8NDM2', 'Anjali Verma', 'AIIMS Delhi', 'Patient presented with symptoms of Malaria. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Vihaan Singh 34', 'NDU2Nzg5Ojs8NTY3', 'NDU2Nzg5Ojs8NDM3', 'Rajesh Kumar', 'Apollo Chennai', 'Patient presented with symptoms of COVID-19. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Ananya Reddy 35', 'NDU2Nzg5Ojs8NTY4', 'NDU2Nzg5Ojs8NDMz', 'Suresh Gupta', 'Apollo Delhi', 'Patient presented with symptoms of Hypertension. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Arjun Nair 36', 'NDU2Nzg5Ojs8NTY5', 'NDU2Nzg5Ojs8NDM0', 'Priya Menon', 'Fortis Mumbai', 'Patient presented with symptoms of Diabetes Type 2. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Ishita Gupta 37', 'NDU2Nzg5Ojs8NTY6', 'NDU2Nzg5Ojs8NDM1', 'Vikram Rathore', 'Manipal Bangalore', 'Patient presented with symptoms of Asthma. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Rohan Iyer 38', 'NDU2Nzg5Ojs8NTY7', 'NDU2Nzg5Ojs8NDM2', 'Anjali Verma', 'AIIMS Delhi', 'Patient presented with symptoms of Migraine. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Meera Desai 39', 'NDU2Nzg5Ojs8NTY8', 'NDU2Nzg5Ojs8NDM3', 'Rajesh Kumar', 'Apollo Chennai', 'Patient presented with symptoms of Gastroenteritis. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Aarav Sharma 40', 'NDU2Nzg5Ojs8NTcz', 'NDU2Nzg5Ojs8NDMz', 'Suresh Gupta', 'Apollo Delhi', 'Patient presented with symptoms of Viral Fever. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Diya Patel 41', 'NDU2Nzg5Ojs8NTc0', 'NDU2Nzg5Ojs8NDM0', 'Priya Menon', 'Fortis Mumbai', 'Patient presented with symptoms of Dengue. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Vihaan Singh 42', 'NDU2Nzg5Ojs8NTc1', 'NDU2Nzg5Ojs8NDM1', 'Vikram Rathore', 'Manipal Bangalore', 'Patient presented with symptoms of Typhoid. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Ananya Reddy 43', 'NDU2Nzg5Ojs8NTc2', 'NDU2Nzg5Ojs8NDM2', 'Anjali Verma', 'AIIMS Delhi', 'Patient presented with symptoms of Malaria. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Arjun Nair 44', 'NDU2Nzg5Ojs8NTc3', 'NDU2Nzg5Ojs8NDM3', 'Rajesh Kumar', 'Apollo Chennai', 'Patient presented with symptoms of COVID-19. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Ishita Gupta 45', 'NDU2Nzg5Ojs8NTc4', 'NDU2Nzg5Ojs8NDMz', 'Suresh Gupta', 'Apollo Delhi', 'Patient presented with symptoms of Hypertension. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Rohan Iyer 46', 'NDU2Nzg5Ojs8NTc5', 'NDU2Nzg5Ojs8NDM0', 'Priya Menon', 'Fortis Mumbai', 'Patient presented with symptoms of Diabetes Type 2. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Meera Desai 47', 'NDU2Nzg5Ojs8NTc6', 'NDU2Nzg5Ojs8NDM1', 'Vikram Rathore', 'Manipal Bangalore', 'Patient presented with symptoms of Asthma. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Aarav Sharma 48', 'NDU2Nzg5Ojs8NTc7', 'NDU2Nzg5Ojs8NDM2', 'Anjali Verma', 'AIIMS Delhi', 'Patient presented with symptoms of Migraine. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]'),
('Diya Patel 49', 'NDU2Nzg5Ojs8NTc8', 'NDU2Nzg5Ojs8NDM3', 'Rajesh Kumar', 'Apollo Chennai', 'Patient presented with symptoms of Gastroenteritis. Recommended rest and prescribed basic medication.', '[{"name":"Paracetamol 500mg","timings":{"morning":true,"afternoon":false,"night":true},"instruction":"After Food","durationDays":5,"startDate":"2026-04-24T02:59:50.349Z"}]');
