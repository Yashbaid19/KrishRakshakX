import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { ShoppingCart, TrendingUp, TrendingDown, Search } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATES = ["Punjab", "Haryana", "Uttar Pradesh", "Maharashtra", "Gujarat", "Rajasthan", "Karnataka", "Tamil Nadu"];
const CATEGORIES = ["vegetables", "fruits", "spices", "pulses", "grains", "dairy"];

export default function MandiPricing() {
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("all");
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPrices = async () => {
    if (!state) {
      toast.error("Please select a state");
      return;
    }

    setLoading(true);
    try {
      const params = { state };
      if (district) params.district = district;
      if (category !== "all") params.category = category;

      const response = await axios.get(`${API}/mandi/prices`, { params });
      setPrices(response.data);
      toast.success("Prices loaded!");
    } catch (error) {
      toast.error("Failed to fetch prices");
    } finally {
      setLoading(false);
    }
  };

  const getTopCommodities = () => {
    return prices.slice(0, 10).map(item => ({
      name: item.commodity,
      price: item.price
    }));
  };

  const groupedPrices = prices.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Mandi Pricing</h1>
        <p className="text-base text-muted-foreground">Real-time agricultural market prices across India</p>
      </div>

      {/* Filters */}
      <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
        <h2 className="text-xl font-semibold mb-4">Search Prices</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>State *</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger data-testid="state-select" className="rounded-lg mt-1">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {STATES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>District (Optional)</Label>
            <Input
              data-testid="district-input"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g., Ludhiana"
              className="rounded-lg mt-1"
            />
          </div>

          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="category-select" className="rounded-lg mt-1">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              data-testid="search-prices-button"
              onClick={fetchPrices}
              disabled={loading || !state}
              className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg"
            >
              <Search className="h-4 w-4 mr-2" />
              Search Prices
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {prices.length > 0 && (
        <>
          {/* Price Chart */}
          <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
            <h2 className="text-xl font-semibold mb-4">Top 10 Commodities by Price</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getTopCommodities()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #D1FAE5',
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey="price" fill="#059669" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Price Tables by Category */}
          <Tabs defaultValue={CATEGORIES[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-emerald-50 rounded-xl p-1">
              {CATEGORIES.map(cat => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary"
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map(cat => (
              <TabsContent key={cat} value={cat}>
                <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedPrices[cat]?.map((item, idx) => (
                      <div
                        key={idx}
                        data-testid={`price-card-${item.commodity}`}
                        className="p-4 bg-gradient-to-br from-white to-emerald-50 rounded-xl border border-emerald-100 card-hover"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{item.commodity}</h3>
                          <ShoppingCart className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold text-primary">₹{item.price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{item.unit}</p>
                          <p className="text-xs text-muted-foreground">{item.state}, {item.district}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!groupedPrices[cat] && (
                    <p className="text-center text-muted-foreground py-8">No prices available for this category</p>
                  )}
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      {prices.length === 0 && !loading && (
        <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-12 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Select state and search to view mandi prices</p>
        </Card>
      )}
    </div>
  );
}