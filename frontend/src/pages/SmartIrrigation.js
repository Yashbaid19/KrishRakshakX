import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Droplets, Power, ThermometerSun, Wind, Activity } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SmartIrrigation() {
  const [sensorData, setSensorData] = useState(null);
  const [history, setHistory] = useState([]);
  const [smartMode, setSmartMode] = useState(false);
  const [pumpStatus, setPumpStatus] = useState("OFF");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [sensorRes, historyRes] = await Promise.all([
        axios.get(`${API}/sensor/latest`, { headers }),
        axios.get(`${API}/sensor/history`, { headers })
      ]);

      setSensorData(sensorRes.data);
      setHistory(historyRes.data);
      setPumpStatus(sensorRes.data.pump_status);
    } catch (error) {
      console.error("Failed to fetch sensor data", error);
    } finally {
      setLoading(false);
    }
  };

  const controlPump = async (action) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API}/pump/control`,
        { action, mode: smartMode ? "auto" : "manual" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPumpStatus(action);
      toast.success(`Pump turned ${action}`);
      await fetchData();
    } catch (error) {
      toast.error("Failed to control pump");
    }
  };

  const moistureThreshold = 35;
  const needsIrrigation = sensorData?.soil_moisture < moistureThreshold;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Activity className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Smart Irrigation</h1>
        <p className="text-base text-muted-foreground">Manage your irrigation system intelligently</p>
      </div>

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          data-testid="moisture-card"
          className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <Droplets className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Soil Moisture</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{sensorData?.soil_moisture?.toFixed(1)}</span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
        </Card>

        <Card
          data-testid="temperature-card"
          className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-50 p-3 rounded-xl">
              <ThermometerSun className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Temperature</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{sensorData?.temperature?.toFixed(1)}</span>
            <span className="text-lg text-muted-foreground">°C</span>
          </div>
        </Card>

        <Card
          data-testid="humidity-card"
          className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-cyan-50 p-3 rounded-xl">
              <Wind className="h-6 w-6 text-cyan-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Humidity</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{sensorData?.humidity?.toFixed(1)}</span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
        </Card>

        <Card
          data-testid="pump-status-card"
          className={`rounded-2xl shadow-sm border p-6 ${
            pumpStatus === "ON" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${
              pumpStatus === "ON" ? "bg-green-100" : "bg-gray-200"
            }`}>
              <Power className={`h-6 w-6 ${
                pumpStatus === "ON" ? "text-green-600" : "text-gray-600"
              }`} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Pump Status</h3>
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                pumpStatus === "ON" ? "bg-green-500 animate-pulse-soft" : "bg-gray-400"
              }`}
            />
            <span className="text-2xl font-bold text-primary">{pumpStatus}</span>
          </div>
        </Card>
      </div>

      {/* Irrigation Alert */}
      {needsIrrigation && (
        <Card className="bg-yellow-50 border-yellow-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-start gap-3">
            <Droplets className="h-6 w-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-semibold text-lg text-yellow-900">Irrigation Recommended</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Soil moisture is below threshold ({moistureThreshold}%). Consider turning on irrigation.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <h2 className="text-2xl font-semibold mb-6">Manual Control</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="font-medium">Smart Irrigation Mode</span>
              <Switch
                data-testid="smart-mode-toggle"
                checked={smartMode}
                onCheckedChange={setSmartMode}
              />
            </div>

            {smartMode && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800">
                  Smart mode enabled. System will automatically control irrigation based on soil moisture levels.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button
                data-testid="pump-on-button"
                onClick={() => controlPump("ON")}
                disabled={pumpStatus === "ON" || smartMode}
                className="rounded-full bg-green-600 hover:bg-green-700 py-6 text-lg font-medium"
              >
                <Power className="h-5 w-5 mr-2" />
                Turn ON
              </Button>
              <Button
                data-testid="pump-off-button"
                onClick={() => controlPump("OFF")}
                disabled={pumpStatus === "OFF" || smartMode}
                variant="outline"
                className="rounded-full border-2 border-red-500 text-red-500 hover:bg-red-50 py-6 text-lg font-medium"
              >
                <Power className="h-5 w-5 mr-2" />
                Turn OFF
              </Button>
            </div>
          </div>
        </Card>

        <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <h2 className="text-2xl font-semibold mb-6">Irrigation Stats</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-white to-emerald-50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Today's Runtime</p>
              <p className="text-3xl font-bold text-primary">2.5 hrs</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-white to-blue-50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Water Used</p>
              <p className="text-3xl font-bold text-blue-600">150 L</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-white to-amber-50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Weekly Average</p>
              <p className="text-3xl font-bold text-secondary">4.2 hrs/day</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <h3 className="text-xl font-semibold mb-6">Soil Moisture History (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #D1FAE5',
                  borderRadius: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="soil_moisture"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#moistureGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <h3 className="text-xl font-semibold mb-6">Water Usage Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[
              { day: "Mon", usage: 145 },
              { day: "Tue", usage: 160 },
              { day: "Wed", usage: 155 },
              { day: "Thu", usage: 170 },
              { day: "Fri", usage: 150 },
              { day: "Sat", usage: 165 },
              { day: "Sun", usage: 150 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #D1FAE5',
                  borderRadius: '12px'
                }}
              />
              <Line
                type="monotone"
                dataKey="usage"
                stroke="#059669"
                strokeWidth={2}
                name="Water (Liters)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}