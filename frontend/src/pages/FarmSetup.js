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
import { Tractor, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATES = ["Punjab", "Haryana", "Uttar Pradesh", "Maharashtra", "Gujarat", "Rajasthan", "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana"];
const SOIL_TYPES = ["Alluvial", "Black", "Red", "Laterite", "Desert", "Mountain"];
const CROPS = ["Rice", "Wheat", "Cotton", "Sugarcane", "Maize", "Pulses", "Vegetables", "Fruits"];

export default function FarmSetup() {
  const [formData, setFormData] = useState({
    farm_name: "",
    state: "",
    district: "",
    farm_size: "",
    soil_type: "",
    primary_crop: "",
    iot_device_id: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API}/farm/setup`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Farm setup completed successfully!");
      setSuccess(true);
    } catch (error) {
      toast.error("Failed to setup farm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Farm Setup</h1>
        <p className="text-base text-muted-foreground">Configure your farm details and connect IoT devices</p>
      </div>

      <div className="max-w-3xl mx-auto">
        {!success ? (
          <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Tractor className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Farm Configuration</h2>
                <p className="text-sm text-muted-foreground">Enter your farm details to get started</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="farm_name">Farm Name *</Label>
                <Input
                  id="farm_name"
                  data-testid="farm-name-input"
                  value={formData.farm_name}
                  onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                  placeholder="Green Valley Farms"
                  className="rounded-lg mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>State *</Label>
                  <Select value={formData.state} onValueChange={(val) => setFormData({ ...formData, state: val })}>
                    <SelectTrigger data-testid="state-select" className="rounded-lg mt-1">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    data-testid="district-input"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Ludhiana"
                    className="rounded-lg mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="farm_size">Farm Size (hectares) *</Label>
                  <Input
                    id="farm_size"
                    data-testid="farm-size-input"
                    type="number"
                    step="0.1"
                    value={formData.farm_size}
                    onChange={(e) => setFormData({ ...formData, farm_size: e.target.value })}
                    placeholder="10.5"
                    className="rounded-lg mt-1"
                    required
                  />
                </div>

                <div>
                  <Label>Soil Type *</Label>
                  <Select value={formData.soil_type} onValueChange={(val) => setFormData({ ...formData, soil_type: val })}>
                    <SelectTrigger data-testid="soil-type-select" className="rounded-lg mt-1">
                      <SelectValue placeholder="Select soil type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOIL_TYPES.map(soil => (
                        <SelectItem key={soil} value={soil}>{soil}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Primary Crop *</Label>
                <Select value={formData.primary_crop} onValueChange={(val) => setFormData({ ...formData, primary_crop: val })}>
                  <SelectTrigger data-testid="primary-crop-select" className="rounded-lg mt-1">
                    <SelectValue placeholder="Select primary crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROPS.map(crop => (
                      <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">IoT Device Configuration (Optional)</h3>
                <div>
                  <Label htmlFor="iot_device_id">IoT Device ID</Label>
                  <Input
                    id="iot_device_id"
                    data-testid="iot-device-input"
                    value={formData.iot_device_id}
                    onChange={(e) => setFormData({ ...formData, iot_device_id: e.target.value })}
                    placeholder="ESP32-XXXXXX"
                    className="rounded-lg mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter your ESP32 or IoT device ID to connect sensors
                  </p>
                </div>
              </div>

              <Button
                data-testid="submit-farm-setup"
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg py-6 text-lg font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-12 text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-primary mb-4">Setup Complete!</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Your farm has been configured successfully. You can now access all features of KrishiRakshak X.
            </p>
            <Button
              onClick={() => window.location.href = "/"}
              className="rounded-full bg-primary hover:bg-primary/90 shadow-lg px-8 py-6 text-lg"
            >
              Go to Dashboard
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}