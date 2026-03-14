import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CROPS = ["Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Potato", "Tomato"];
const SOIL_QUALITY = ["Excellent", "Good", "Average", "Poor"];

export default function YieldPrediction() {
  const [formData, setFormData] = useState({
    crop: "",
    area: "",
    soil_quality: "",
    rainfall: "",
    temperature: ""
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API}/yield/predict`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResult(response.data);
      toast.success("Yield prediction completed!");
    } catch (error) {
      toast.error("Failed to predict yield");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Yield Prediction</h1>
        <p className="text-base text-muted-foreground">Estimate your crop yield using AI predictions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <h2 className="text-2xl font-semibold mb-6">Prediction Parameters</h2>
          <form onSubmit={handlePredict} className="space-y-4">
            <div>
              <Label>Crop Type *</Label>
              <Select value={formData.crop} onValueChange={(val) => setFormData({ ...formData, crop: val })}>
                <SelectTrigger data-testid="crop-select" className="rounded-lg mt-1">
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent>
                  {CROPS.map(crop => (
                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Farm Area (hectares) *</Label>
              <Input
                data-testid="area-input"
                type="number"
                step="0.1"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="5.0"
                className="rounded-lg mt-1"
                required
              />
            </div>

            <div>
              <Label>Soil Quality *</Label>
              <Select value={formData.soil_quality} onValueChange={(val) => setFormData({ ...formData, soil_quality: val })}>
                <SelectTrigger data-testid="soil-quality-select" className="rounded-lg mt-1">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {SOIL_QUALITY.map(quality => (
                    <SelectItem key={quality} value={quality}>{quality}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Expected Rainfall (mm) *</Label>
              <Input
                data-testid="rainfall-input"
                type="number"
                value={formData.rainfall}
                onChange={(e) => setFormData({ ...formData, rainfall: e.target.value })}
                placeholder="1000"
                className="rounded-lg mt-1"
                required
              />
            </div>

            <div>
              <Label>Average Temperature (°C) *</Label>
              <Input
                data-testid="temperature-input"
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                placeholder="28"
                className="rounded-lg mt-1"
                required
              />
            </div>

            <Button
              data-testid="predict-yield-button"
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg py-6 text-lg font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Predict Yield
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <Card
                data-testid="yield-result-card"
                className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Prediction Results</h2>
                
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Estimated Yield</p>
                    <p className="text-5xl font-bold text-primary mb-2">{result.predicted_yield}</p>
                    <p className="text-base text-muted-foreground">{result.unit}</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-white to-blue-50 rounded-xl">
                    <span className="text-muted-foreground">Confidence Level</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-blue-600">{(result.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-white to-amber-50 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">Total Production</p>
                    <p className="text-2xl font-bold text-secondary">
                      {(result.predicted_yield * parseFloat(formData.area)).toFixed(2)} tons
                    </p>
                  </div>
                </div>
              </Card>

              {/* Rainfall vs Yield Chart */}
              <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
                <h2 className="text-xl font-semibold mb-4">Rainfall Impact on Yield</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={result.rainfall_yield_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="left" stroke="#059669" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #D1FAE5',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="yield"
                      stroke="#059669"
                      strokeWidth={2}
                      name="Yield (tons)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rainfall"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Rainfall (mm)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </>
          ) : (
            <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-12 text-center h-full flex items-center justify-center">
              <div>
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Enter crop details to predict yield</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}