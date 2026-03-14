import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Calculator, ExternalLink, Wallet, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ["#059669", "#D97706", "#3B82F6", "#EF4444"];

export default function Financial() {
  const [loanData, setLoanData] = useState({
    principal: "",
    rate: "",
    years: ""
  });
  const [loanResult, setLoanResult] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [selectedState,setSelectedState] = useState("")
  const [centralSchemes,setCentralSchemes] = useState([])
  const [stateSchemes,setStateSchemes] = useState([])

  const calculateLoan = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/finance/loan-calculator`, {
        principal: parseFloat(loanData.principal),
        rate: parseFloat(loanData.rate),
        years: parseFloat(loanData.years)
      });
      setLoanResult(response.data);
      toast.success("Loan calculation complete!");
    } catch (error) {
      toast.error("Failed to calculate loan");
    }
  };

  const loadSchemes = async () => {
    setLoadingSchemes(true)

    try{

      const response = await axios.get(`${API}/finance/schemes`)

      setCentralSchemes(response.data.central)

      if(selectedState && response.data.states[selectedState]){
        setStateSchemes(response.data.states[selectedState])
      } else{
        setStateSchemes([])
      }

    }catch(error){
      toast.error("Failed to load schemes")
    }finally{
      setLoadingSchemes(false)
    }
  };

  const getRepaymentSchedule = () => {
    if (!loanResult) return [];
    const schedule = [];
    for (let year = 1; year <= parseInt(loanData.years); year++) {
      schedule.push({
        year: `Year ${year}`,
        payment: loanResult.monthly_payment * 12
      });
    }
    return schedule;
  };

  const getLoanBreakdown = () => {
    if (!loanResult) return [];
    return [
      { name: "Principal", value: parseFloat(loanData.principal) },
      { name: "Interest", value: loanResult.total_interest }
    ];
  };

  // Mock P&L data
  const profitLossData = [
    { month: "Jan", revenue: 45000, expenses: 32000 },
    { month: "Feb", revenue: 52000, expenses: 35000 },
    { month: "Mar", revenue: 48000, expenses: 33000 },
    { month: "Apr", revenue: 61000, expenses: 38000 },
    { month: "May", revenue: 55000, expenses: 36000 },
    { month: "Jun", revenue: 67000, expenses: 40000 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Financial Support</h1>
        <p className="text-base text-muted-foreground">Loans, insurance, and government schemes for farmers</p>
      </div>

      <Tabs defaultValue="loan" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-emerald-50 rounded-xl p-1">
          <TabsTrigger
            value="loan"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary"
          >
            Loan Calculator
          </TabsTrigger>
          <TabsTrigger
            value="schemes"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary"
          >
            Schemes
          </TabsTrigger>
          <TabsTrigger
            value="insurance"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary"
          >
            Insurance
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary"
          >
            P&L Analytics
          </TabsTrigger>
        </TabsList>

        {/* Loan Calculator */}
        <TabsContent value="loan">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
              <h2 className="text-2xl font-semibold mb-6">Calculate Your Loan</h2>
              <form onSubmit={calculateLoan} className="space-y-4">
                <div>
                  <Label htmlFor="principal">Loan Amount (₹) *</Label>
                  <Input
                    id="principal"
                    data-testid="loan-principal-input"
                    type="number"
                    value={loanData.principal}
                    onChange={(e) => setLoanData({ ...loanData, principal: e.target.value })}
                    placeholder="100000"
                    className="rounded-lg mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rate">Interest Rate (% per year) *</Label>
                  <Input
                    id="rate"
                    data-testid="loan-rate-input"
                    type="number"
                    step="0.1"
                    value={loanData.rate}
                    onChange={(e) => setLoanData({ ...loanData, rate: e.target.value })}
                    placeholder="7.5"
                    className="rounded-lg mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="years">Loan Period (years) *</Label>
                  <Input
                    id="years"
                    data-testid="loan-years-input"
                    type="number"
                    value={loanData.years}
                    onChange={(e) => setLoanData({ ...loanData, years: e.target.value })}
                    placeholder="5"
                    className="rounded-lg mt-1"
                    required
                  />
                </div>
                <Button
                  data-testid="calculate-loan-button"
                  type="submit"
                  className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg py-6 text-lg font-medium"
                >
                  <Calculator className="h-5 w-5 mr-2" />
                  Calculate
                </Button>
              </form>
            </Card>

            {loanResult && (
              <div className="space-y-6">
                <Card
                  data-testid="loan-result-card"
                  className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6"
                >
                  <h3 className="text-xl font-semibold mb-4">Loan Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-br from-white to-emerald-50 rounded-xl">
                      <span className="text-muted-foreground">Monthly Payment</span>
                      <span className="text-2xl font-bold text-primary">₹{loanResult.monthly_payment.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-br from-white to-amber-50 rounded-xl">
                      <span className="text-muted-foreground">Total Payment</span>
                      <span className="text-xl font-bold text-secondary">₹{loanResult.total_payment.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-br from-white to-blue-50 rounded-xl">
                      <span className="text-muted-foreground">Total Interest</span>
                      <span className="text-xl font-bold text-blue-600">₹{loanResult.total_interest.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
                  <h3 className="text-lg font-semibold mb-4">Loan Breakdown</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={getLoanBreakdown()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getLoanBreakdown().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
                  <h3 className="text-lg font-semibold mb-4">Annual Payment Schedule</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={getRepaymentSchedule()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Bar dataKey="payment" fill="#059669" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            )}

            {!loanResult && (
              <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-12 text-center flex items-center justify-center">
                <div>
                  <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Enter loan details to see results</p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Government Schemes */}
        <TabsContent value="schemes">
          <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">

            <h2 className="text-2xl font-semibold mb-6">Government Schemes</h2>

            {/* State Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

              <div>
                <Label>Select State</Label>
                <select
                  className="w-full border rounded-lg p-2 mt-1"
                  value={selectedState}
                  onChange={(e)=>setSelectedState(e.target.value)}
                >
                  <option value="">Select State</option>
                  <option value="maharashtra">Maharashtra</option>
                  <option value="karnataka">Karnataka</option>
                  <option value="punjab">Punjab</option>
                  <option value="uttar_pradesh">Uttar Pradesh</option>
                  <option value="rajasthan">Rajasthan</option>
                  <option value="madhya_pradesh">Madhya Pradesh</option>
                  <option value="tamil_nadu">Tamil Nadu</option>
                  <option value="gujarat">Gujarat</option>
                  <option value="bihar">Bihar</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={loadSchemes}
                  disabled={loadingSchemes}
                  className="rounded-full bg-primary hover:bg-primary/90"
                >
                  Load Schemes
                </Button>
              </div>

            </div>


            {/* Central Schemes */}
            {centralSchemes.length > 0 && (
              <div className="mb-8">

                <Label className="text-lg font-semibold">Central Government Schemes</Label>

                <div className="space-y-4 mt-4">

                  {centralSchemes.map((scheme,idx)=>(
                    <div
                      key={idx}
                      className="p-6 bg-gradient-to-br from-white to-emerald-50 rounded-xl border border-emerald-100"
                    >

                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-primary">{scheme.name}</h3>
                        <Wallet className="h-6 w-6 text-primary"/>
                      </div>

                      <p className="text-base text-gray-700 mb-3">{scheme.description}</p>

                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>Eligibility:</strong> {scheme.eligibility}
                      </p>

                      <Button
                        variant="outline"
                        className="rounded-full border-2 border-primary text-primary hover:bg-primary/5"
                        onClick={()=>window.open(scheme.link,'_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2"/>
                        Visit Scheme
                      </Button>

                    </div>
                  ))}

                </div>
              </div>
            )}


            {/* State Schemes */}
            {stateSchemes.length > 0 && (
              <div>

                <Label className="text-lg font-semibold">
                  {selectedState.replace("_"," ").toUpperCase()} State Schemes
                </Label>

                <div className="space-y-4 mt-4">

                  {stateSchemes.map((scheme,idx)=>(
                    <div
                      key={idx}
                      className="p-6 bg-gradient-to-br from-white to-blue-50 rounded-xl border border-blue-100"
                    >

                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-blue-700">{scheme.name}</h3>
                        <Wallet className="h-6 w-6 text-blue-700"/>
                      </div>

                      <p className="text-base text-gray-700 mb-3">{scheme.description}</p>

                      <Button
                        variant="outline"
                        className="rounded-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={()=>window.open(scheme.link,'_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2"/>
                        Visit Scheme
                        </Button>

                    </div>
                  ))}

                </div>
              </div>
            )}

          </Card>
        </TabsContent>

        {/* Insurance */}
        <TabsContent value="insurance">
          <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
            <h2 className="text-2xl font-semibold mb-6">Crop Insurance</h2>
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100">
                <h3 className="text-xl font-bold text-primary mb-3">Pradhan Mantri Fasal Bima Yojana (PMFBY)</h3>
                <p className="text-base text-gray-700 mb-4">
                  Comprehensive crop insurance scheme to protect farmers against crop loss due to natural calamities, pests, and diseases.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li>• Premium: 2% for Kharif crops, 1.5% for Rabi crops</li>
                  <li>• Covers yield losses due to non-preventable natural risks</li>
                  <li>• Claim settlement within 60 days</li>
                  <li>• Coverage from sowing to post-harvest</li>
                </ul>
                <Button
                  className="rounded-full bg-primary hover:bg-primary/90"
                  onClick={() => window.open('https://pmfby.gov.in/', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apply Now
                </Button>
              </div>

              <div className="p-6 bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100">
                <h3 className="text-xl font-bold text-secondary mb-3">Weather-Based Crop Insurance</h3>
                <p className="text-base text-gray-700 mb-4">
                  Insurance based on weather parameters like rainfall, temperature, humidity affecting crop production.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li>• Quick payout based on weather data</li>
                  <li>• No crop cutting experiments required</li>
                  <li>• Transparent and timely claim settlement</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* P&L Analytics */}
        <TabsContent value="analytics">
          <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
            <h2 className="text-2xl font-semibold mb-6">Profit & Loss Analytics</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={profitLossData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #D1FAE5',
                    borderRadius: '12px'
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#059669" radius={[8, 8, 0, 0]} name="Revenue" />
                <Bar dataKey="expenses" fill="#D97706" radius={[8, 8, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="p-4 bg-gradient-to-br from-white to-emerald-50 rounded-xl border border-emerald-100 text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">₹3,28,000</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-white to-amber-50 rounded-xl border border-amber-100 text-center">
                <Wallet className="h-8 w-8 text-secondary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-secondary">₹2,14,000</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-white to-blue-50 rounded-xl border border-blue-100 text-center">
                <Calculator className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                <p className="text-2xl font-bold text-blue-600">₹1,14,000</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}