import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tractor, Plus, MapPin, Phone, IndianRupee, Search } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATES = ["Punjab", "Haryana", "Uttar Pradesh", "Maharashtra", "Gujarat"];
const EQUIPMENT_TYPES = ["Tractor", "Harvester", "Drone", "Sprayer", "Plough", "Seeder"];

export default function EquipmentRental() {
  const [equipment, setEquipment] = useState([]);
  const [myEquipment, setMyEquipment] = useState([]);
  const [filters, setFilters] = useState({ state: "", district: "", type: "all" });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    price_per_day: "",
    state: "",
    district: "",
    contact: ""
  });

  useEffect(() => {
    fetchMyEquipment();
  }, []);

  const fetchMyEquipment = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/equipment/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyEquipment(response.data);
    } catch (error) {
      console.error("Failed to fetch equipment", error);
    }
  };

  const searchEquipment = async () => {
    if (!filters.state) {
      toast.error("Please select a state");
      return;
    }

    try {
      const params = {};
      if (filters.state) params.state = filters.state;
      if (filters.district) params.district = filters.district;
      if (filters.type && filters.type !== "all") {
        params.equipment_type = filters.type;
      }

      const response = await axios.get(`${API}/equipment`, { params });
      setEquipment(response.data);
      toast.success("Equipment loaded!");
    } catch (error) {
      toast.error("Failed to fetch equipment");
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/equipment`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Equipment listed successfully!");
      setShowAddDialog(false);
      setFormData({
        name: "",
        type: "",
        description: "",
        price_per_day: "",
        state: "",
        district: "",
        contact: ""
      });
      fetchMyEquipment();
    } catch (error) {
      toast.error("Failed to add equipment");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Equipment Rental</h1>
          <p className="text-base text-muted-foreground">Rent or list farming equipment</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-equipment-button"
              className="rounded-full bg-primary hover:bg-primary/90 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              List Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>List Your Equipment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEquipment} className="space-y-4 mt-4">
              <div>
                <Label>Equipment Name *</Label>
                <Input
                  data-testid="equipment-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Deere 5050D"
                  className="rounded-lg mt-1"
                  required
                />
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                  <SelectTrigger data-testid="equipment-type-select" className="rounded-lg mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  data-testid="equipment-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your equipment"
                  className="rounded-lg mt-1"
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label>Price per Day (₹) *</Label>
                <Input
                  data-testid="equipment-price-input"
                  type="number"
                  value={formData.price_per_day}
                  onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                  placeholder="2000"
                  className="rounded-lg mt-1"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>State *</Label>
                  <Select value={formData.state} onValueChange={(val) => setFormData({ ...formData, state: val })}>
                    <SelectTrigger data-testid="equipment-state-select" className="rounded-lg mt-1">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>District *</Label>
                  <Input
                    data-testid="equipment-district-input"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="District"
                    className="rounded-lg mt-1"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input
                  data-testid="equipment-contact-input"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="+91 9876543210"
                  className="rounded-lg mt-1"
                />
              </div>
              <Button
                data-testid="submit-equipment-button"
                type="submit"
                className="w-full rounded-full bg-primary hover:bg-primary/90"
              >
                List Equipment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Listings */}
      {myEquipment.length > 0 && (
        <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <h2 className="text-xl font-semibold mb-4">My Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEquipment.map((item, idx) => (
              <div
                key={idx}
                data-testid={`my-equipment-${idx}`}
                className="p-4 bg-gradient-to-br from-white to-emerald-50 rounded-xl border border-emerald-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                    {item.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-primary font-bold">
                    <IndianRupee className="h-4 w-4" />
                    {item.price_per_day}/day
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {item.district}, {item.state}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search Filters */}
      <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
        <h2 className="text-xl font-semibold mb-4">Search Equipment</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>State *</Label>
            <Select value={filters.state} onValueChange={(val) => setFilters({ ...filters, state: val })}>
              <SelectTrigger data-testid="filter-state-select" className="rounded-lg mt-1">
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
            <Label>District</Label>
            <Input
              data-testid="filter-district-input"
              value={filters.district}
              onChange={(e) => setFilters({ ...filters, district: e.target.value })}
              placeholder="Optional"
              className="rounded-lg mt-1"
            />
          </div>
          <div>
            <Label>Equipment Type</Label>
            <Select value={filters.type} onValueChange={(val) => setFilters({ ...filters, type: val })}>
              <SelectTrigger data-testid="filter-type-select" className="rounded-lg mt-1">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EQUIPMENT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              data-testid="search-equipment-button"
              onClick={searchEquipment}
              disabled={!filters.state}
              className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </Card>

      {/* Search Results */}
      {equipment.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((item, idx) => (
            <Card
              key={idx}
              data-testid={`equipment-card-${idx}`}
              className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 card-hover"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                  <span className="bg-emerald-100 text-primary px-2 py-1 rounded-lg text-xs font-medium">
                    {item.type}
                  </span>
                </div>
                <Tractor className="h-8 w-8 text-primary" />
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  <span className="font-bold text-primary text-lg">{item.price_per_day}/day</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{item.district}, {item.state}</span>
                </div>
                {item.contact && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{item.contact}</span>
                  </div>
                )}
              </div>
              
              <Button
                data-testid={`contact-owner-button-${idx}`}
                className="w-full mt-4 rounded-full bg-secondary hover:bg-secondary/90"
              >
                Contact Owner
              </Button>
            </Card>
          ))}
        </div>
      )}

      {equipment.length === 0 && filters.state && (
        <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-12 text-center">
          <Tractor className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No equipment found. Try different filters.</p>
        </Card>
      )}
    </div>
  );
}