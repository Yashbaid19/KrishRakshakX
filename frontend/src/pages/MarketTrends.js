import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from "recharts";
import { TrendingUp, Search } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CROPS = ["Wheat", "Rice", "Maize", "Cotton", "Sugarcane", "Potato", "Tomato", "Onion"];

export default function MarketTrends() {
  const [crop, setCrop] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTrends = async () => {
    if (!crop) {
      toast.error("Please select a crop");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API}/market/trends`, {
        params: { crop, frequency }
      });
      setTrends(response.data);
      toast.success("Trends loaded!");
    } catch (error) {
      toast.error("Failed to fetch trends");
    } finally {
      setLoading(false);
    }
  };

  const currentData = trends.filter(t => !t.predicted);
  const predictedData = trends.filter(t => t.predicted);
  const avgPrice = currentData.length > 0 ? (currentData.reduce((sum, t) => sum + t.price, 0) / currentData.length).toFixed(2) : 0;
  const lastPrice = currentData.length > 0 ? currentData[currentData.length - 1].price : 0;
  const predictedPrice = predictedData.length > 0 ? predictedData[predictedData.length - 1].price : 0;
  const priceChange = lastPrice && predictedPrice ? ((predictedPrice - lastPrice) / lastPrice * 100).toFixed(2) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Market Price Trends</h1>
        <p className="text-base text-muted-foreground">Historical and predicted market prices</p>
      </div>

      {/* Filters */}
      <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
        <h2 className="text-xl font-semibold mb-4">Select Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Crop *</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger data-testid="crop-select" className="rounded-lg mt-1">
                <SelectValue placeholder="Select crop" />
              </SelectTrigger>
              <SelectContent>
                {CROPS.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger data-testid="frequency-select" className="rounded-lg mt-1">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              data-testid="fetch-trends-button"
              onClick={fetchTrends}
              disabled={loading || !crop}
              className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg"
            >
              <Search className="h-4 w-4 mr-2" />
              View Trends
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {trends.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              data-testid="avg-price-card"
              className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6"
            >
              <p className="text-sm text-muted-foreground mb-2">Average Price</p>
              <p className="text-3xl font-bold text-primary">₹{avgPrice}</p>
              <p className="text-xs text-muted-foreground mt-1">per quintal</p>
            </Card>

            <Card
              data-testid="current-price-card"
              className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6"
            >
              <p className="text-sm text-muted-foreground mb-2">Current Price</p>
              <p className="text-3xl font-bold text-primary">₹{lastPrice?.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Latest recorded</p>
            </Card>

            <Card
              data-testid="predicted-change-card"
              className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6"
            >
              <p className="text-sm text-muted-foreground mb-2">Predicted Change</p>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-bold ${
                  priceChange > 0 ? "text-green-600" : priceChange < 0 ? "text-red-600" : "text-gray-600"
                }`}>
                  {priceChange > 0 ? "+" : ""}{priceChange}%
                </p>
                <TrendingUp className={`h-6 w-6 ${
                  priceChange > 0 ? "text-green-600" : "text-red-600"
                } ${priceChange < 0 && "rotate-180"}`} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Next 7 days</p>
            </Card>
          </div>

          {/* Price Trend Chart */}
          <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
            <h2 className="text-xl font-semibold mb-6">{crop} Price Trend - {frequency === "daily" ? "Last 30 Days" : "Last 52 Weeks"}</h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #D1FAE5',
                    borderRadius: '12px'
                  }}
                  formatter={(value, name) => [
                    `₹${value.toFixed(2)}`,
                    name === "price" ? "Price" : "Predicted"
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                  name="Actual Price"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Predicted Prices */}
          {predictedData.length > 0 && (
            <Card className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl shadow-sm border border-emerald-100 p-6">
              <h2 className="text-xl font-semibold mb-4">Predicted Prices (Next 7 Days)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {predictedData.map((item, idx) => (
                  <div
                    key={idx}
                    data-testid={`predicted-price-${idx}`}
                    className="bg-white p-4 rounded-xl border border-emerald-100 text-center"
                  >
                    <p className="text-xs text-muted-foreground mb-1">{item.date}</p>
                    <p className="text-lg font-bold text-secondary">₹{item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {trends.length === 0 && !loading && (
        <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-12 text-center">
          <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select crop and frequency to view market trends</p>
        </Card>
      )}
    </div>
  );
}