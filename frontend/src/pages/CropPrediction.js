import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Sprout, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CropPrediction() {
  const [useManualInput, setUseManualInput] = useState(true);
  const [formData, setFormData] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    temperature: "",
    humidity: "",
    soil_moisture: "",
  });
  const [recommendations, setRecommendations] = useState([]);
  const [nutrientBalance, setNutrientBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API}/crop/predict`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRecommendations(response.data.recommended_crops);
      setNutrientBalance(response.data.nutrient_balance);
      toast.success("Crop recommendations generated!");
    } catch (error) {
      toast.error("Failed to get predictions");
    } finally {
      setLoading(false);
    }
  };

  const useSensorData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/sensor/latest`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data;
      setFormData({
        nitrogen: data.nitrogen.toFixed(0),
        phosphorus: data.phosphorus.toFixed(0),
        potassium: data.potassium.toFixed(0),
        temperature: data.temperature.toFixed(1),
        humidity: data.humidity.toFixed(1),
        soil_moisture: data.soil_moisture.toFixed(1),
      });
      
      toast.success("Sensor data loaded!");
    } catch (error) {
      toast.error("Failed to load sensor data");
    } finally {
      setLoading(false);
    }
  };

  const chartData = recommendations.map(rec => ({
    name: rec.name,
    suitability: (rec.score * 100).toFixed(1)
  }));

  const radarData = nutrientBalance ? [
    { nutrient: 'Nitrogen', value: nutrientBalance.nitrogen },
    { nutrient: 'Phosphorus', value: nutrientBalance.phosphorus },
    { nutrient: 'Potassium', value: nutrientBalance.potassium },
    { nutrient: 'Moisture', value: nutrientBalance.moisture }
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Crop Prediction</h1>
        <p className="text-base text-muted-foreground">Get AI-powered crop recommendations based on your soil data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Soil Parameters</h2>
            <Button
              data-testid="use-sensor-data-button"
              onClick={useSensorData}
              variant="outline"
              className="rounded-full border-2 border-primary text-primary hover:bg-primary/5"
              disabled={loading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Use Sensor Data
            </Button>
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nitrogen">Nitrogen (kg/ha)</Label>
                <Input
                  id="nitrogen"
                  name="nitrogen"
                  data-testid="nitrogen-input"
                  type="number"
                  value={formData.nitrogen}
                  onChange={handleChange}
                  placeholder="250"
                  className="rounded-lg mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phosphorus">Phosphorus (kg/ha)</Label>
                <Input
                  id="phosphorus"
                  name="phosphorus"
                  data-testid="phosphorus-input"
                  type="number"
                  value={formData.phosphorus}
                  onChange={handleChange}
                  placeholder="30"
                  className="rounded-lg mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="potassium">Potassium (kg/ha)</Label>
                <Input
                  id="potassium"
                  name="potassium"
                  data-testid="potassium-input"
                  type="number"
                  value={formData.potassium}
                  onChange={handleChange}
                  placeholder="200"
                  className="rounded-lg mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  name="temperature"
                  data-testid="temperature-input"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={handleChange}
                  placeholder="25"
                  className="rounded-lg mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input
                  id="humidity"
                  name="humidity"
                  data-testid="humidity-input"
                  type="number"
                  step="0.1"
                  value={formData.humidity}
                  onChange={handleChange}
                  placeholder="60"
                  className="rounded-lg mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="soil_moisture">Soil Moisture (%)</Label>
                <Input
                  id="soil_moisture"
                  name="soil_moisture"
                  data-testid="soil-moisture-input"
                  type="number"
                  step="0.1"
                  value={formData.soil_moisture}
                  onChange={handleChange}
                  placeholder="45"
                  className="rounded-lg mt-1"
                  required
                />
              </div>
            </div>

            <Button
              data-testid="predict-crop-button"
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg py-6 text-lg font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sprout className="mr-2 h-5 w-5" />
                  Get Recommendations
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {recommendations.length > 0 && (
            <>
              {/* Recommended Crops */}
              <Card
                data-testid="crop-recommendations-card"
                className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6"
              >
                <h2 className="text-2xl font-semibold mb-4\">Recommended Crops</h2>
                <div className="space-y-3">
                  {recommendations.map((crop, idx) => (
                    <div
                      key={idx}
                      data-testid={`recommended-crop-${idx}`}
                      className="p-4 bg-gradient-to-br from-white to-emerald-50 rounded-xl border border-emerald-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-primary">{crop.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{crop.season}</p>
                        </div>
                        <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                          {(crop.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{crop.reason}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Nutrient Balance Radar */}
              {nutrientBalance && (
                <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
                  <h2 className="text-xl font-semibold mb-4">Nutrient Balance Analysis</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#D1FAE5" />
                      <PolarAngleAxis dataKey="nutrient" style={{ fontSize: '12px' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} style={{ fontSize: '10px' }} />
                      <Radar
                        name="Nutrient Level"
                        dataKey="value"
                        stroke="#059669"
                        fill="#059669"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Chart */}
              <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
                <h2 className="text-xl font-semibold mb-4">Suitability Comparison</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #D1FAE5',
                        borderRadius: '12px'
                      }}
                    />
                    <Bar dataKey="suitability" fill="#059669" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}

          {recommendations.length === 0 && (
            <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-12 text-center">
              <Sprout className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Enter soil parameters to get crop recommendations</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}