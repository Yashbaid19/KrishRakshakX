import { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import {
  Droplets,
  ThermometerSun,
  Wind,
  Sprout,
  TestTube,
  Activity,
  Power,
  CloudRain
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {

  const [sensorData, setSensorData] = useState(null);
  const [history, setHistory] = useState([]);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    fetchDashboardData();

    // refresh every 5 seconds
    const interval = setInterval(fetchDashboardData, 5000);

    return () => clearInterval(interval);

  }, []);

  const fetchDashboardData = async () => {

    try {

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [sensorRes, historyRes, weatherRes] = await Promise.all([
        axios.get(`${API}/sensor/latest`, { headers }),
        axios.get(`${API}/sensor/history`, { headers }),
        axios.get(`${API}/weather/alerts`)
      ]);

      setSensorData(sensorRes.data);

      // convert timestamps to numbers
      const formattedHistory = historyRes.data.map(item => ({
        ...item,
        timestamp: Number(item.timestamp)
      }));

      setHistory(formattedHistory);

      setWeatherAlerts(weatherRes.data);

    } catch (error) {

      console.error("Dashboard fetch error:", error);

    } finally {

      setLoading(false);

    }

  };

  const sensorCards = [
    {
      label: "Soil Moisture",
      value: sensorData?.soil_moisture ? Number(sensorData.soil_moisture).toFixed(1) : "--",
      unit: "%",
      icon: Droplets,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Nitrogen",
      value: sensorData?.nitrogen ? Number(sensorData.nitrogen).toFixed(0) : "--",
      unit: "kg/ha",
      icon: TestTube,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      label: "Phosphorus",
      value: sensorData?.phosphorus ? Number(sensorData.phosphorus).toFixed(0) : "--",
      unit: "kg/ha",
      icon: TestTube,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      label: "Potassium",
      value: sensorData?.potassium ? Number(sensorData.potassium).toFixed(0) : "--",
      unit: "kg/ha",
      icon: TestTube,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      label: "Temperature",
      value: sensorData?.temperature ? Number(sensorData.temperature).toFixed(1) : "--",
      unit: "°C",
      icon: ThermometerSun,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      label: "Humidity",
      value: sensorData?.humidity ? Number(sensorData.humidity).toFixed(1) : "--",
      unit: "%",
      icon: Wind,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50"
    }
  ];

  if (loading) {

    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );

  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
          Dashboard
        </h1>
        <p className="text-base text-muted-foreground">
          Real-time farm monitoring and insights
        </p>
      </div>

      {/* SENSOR CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {sensorCards.map((card, idx) => {

          const Icon = card.icon;

          return (
            <Card key={idx} className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">

              <div className="flex items-center justify-between mb-4">
                <div className={`${card.bgColor} p-3 rounded-xl`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>

              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                {card.label}
              </h3>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">{card.value}</span>
                <span className="text-lg text-muted-foreground">{card.unit}</span>
              </div>

            </Card>
          );

        })}

      </div>

      {/* SOIL MOISTURE CHART */}

      <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">

        <h3 className="text-xl font-semibold mb-6">Soil Moisture Trend</h3>

        <ResponsiveContainer width="100%" height={250}>

          <AreaChart data={history}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="timestamp"
              tickFormatter={(t) => new Date(t).getHours() + "h"}
            />

            <YAxis />

            <Tooltip
              labelFormatter={(t) => new Date(t).toLocaleString()}
            />

            <Area
              type="monotone"
              dataKey="soil_moisture"
              stroke="#059669"
              fill="#10b98155"
            />

          </AreaChart>

        </ResponsiveContainer>

      </Card>

      {/* ENVIRONMENTAL CHART */}

      <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">

        <h3 className="text-xl font-semibold mb-6">Environmental Data</h3>

        <ResponsiveContainer width="100%" height={250}>

          <LineChart data={history}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="timestamp"
              tickFormatter={(t) => new Date(t).getHours() + "h"}
            />

            <YAxis />

            <Tooltip
              labelFormatter={(t) => new Date(t).toLocaleString()}
            />

            <Legend />

            <Line dataKey="temperature" stroke="#ef4444" strokeWidth={2} />
            <Line dataKey="humidity" stroke="#3b82f6" strokeWidth={2} />

          </LineChart>

        </ResponsiveContainer>

      </Card>

    </div>
  );

}