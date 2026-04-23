import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import DoctorPortal from './pages/DoctorPortal.jsx';
import PatientPortal from './pages/PatientPortal.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/doctor-portal" element={<DoctorPortal />} />
        <Route path="/patient-portal" element={<PatientPortal />} />
      </Routes>
    </Router>
  );
}
