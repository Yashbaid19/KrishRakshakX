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
import { User, MapPin, Sprout, Save, Loader2, Cpu } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATES = ["Punjab", "Haryana", "Uttar Pradesh", "Maharashtra", "Gujarat"];
const CROPS = ["Rice", "Wheat", "Cotton", "Sugarcane", "Maize", "Pulses"];
const SOIL_TYPES = ["Alluvial", "Black", "Red", "Laterite", "Desert"];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    phone: "",
    state: "",
    district: "",
    farm_size: "",
    soil_type: "",
    primary_crop: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfile(response.data);
      setFormData({
        phone: response.data.phone || "",
        state: response.data.state || "",
        district: response.data.district || "",
        farm_size: response.data.farm_size || "",
        soil_type: response.data.soil_type || "",
        primary_crop: response.data.primary_crop || ""
      });
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/profile/update`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Profile updated successfully!");
      await fetchProfile();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">My Profile</h1>
        <p className="text-base text-muted-foreground">Manage your account and farm information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <div className="text-center">
            <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-1">{profile?.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{profile?.email}</p>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.district}, {profile?.state}</span>
              </div>
              {profile?.farm_size && (
                <div className="flex items-center gap-2 text-sm">
                  <Sprout className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.farm_size} hectares</span>
                </div>
              )}
            </div>
          </div>

          {/* IoT Devices */}
          {profile?.iot_devices && profile.iot_devices.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Connected Devices
              </h3>
              <div className="space-y-2">
                {profile.iot_devices.map((device, idx) => (
                  <div
                    key={idx}
                    data-testid={`iot-device-${idx}`}
                    className="p-3 bg-emerald-50 rounded-lg text-sm"
                  >
                    <p className="font-medium">{device.device_id}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: <span className="text-green-600">{device.status}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Edit Form */}
        <Card className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <h2 className="text-2xl font-semibold mb-6">Edit Profile</h2>
          
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                data-testid="phone-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="rounded-lg mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>State</Label>
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
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  data-testid="district-input"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Ludhiana"
                  className="rounded-lg mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="farm_size">Farm Size (hectares)</Label>
                <Input
                  id="farm_size"
                  data-testid="farm-size-input"
                  type="number"
                  step="0.1"
                  value={formData.farm_size}
                  onChange={(e) => setFormData({ ...formData, farm_size: e.target.value })}
                  placeholder="10.5"
                  className="rounded-lg mt-1"
                />
              </div>

              <div>
                <Label>Soil Type</Label>
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
              <Label>Primary Crop</Label>
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

            <Button
              data-testid="save-profile-button"
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg py-6 text-lg font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}