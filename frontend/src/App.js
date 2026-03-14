import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import CropPrediction from "@/pages/CropPrediction";
import YieldPrediction from "@/pages/YieldPrediction";
import DiseaseDetection from "@/pages/DiseaseDetection";
import MandiPricing from "@/pages/MandiPricing";
import MarketTrends from "@/pages/MarketTrends";
import EquipmentRental from "@/pages/EquipmentRental";
import Financial from "@/pages/Financial";
import SmartIrrigation from "@/pages/SmartIrrigation";
import FarmSetup from "@/pages/FarmSetup";
import Profile from "@/pages/Profile";
import Layout from "@/components/Layout";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const handleLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/register" element={!token ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />
          
          <Route path="/" element={token ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="crop-prediction" element={<CropPrediction />} />
            <Route path="yield-prediction" element={<YieldPrediction />} />
            <Route path="disease-detection" element={<DiseaseDetection />} />
            <Route path="smart-irrigation" element={<SmartIrrigation />} />
            <Route path="mandi-pricing" element={<MandiPricing />} />
            <Route path="market-trends" element={<MarketTrends />} />
            <Route path="equipment-rental" element={<EquipmentRental />} />
            <Route path="financial" element={<Financial />} />
            <Route path="farm-setup" element={<FarmSetup />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;