import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Home,
  Sprout,
  Bug,
  ShoppingCart,
  TrendingUp,
  Tractor,
  Wallet,
  MessageSquare,
  Menu,
  X,
  LogOut,
  Droplets,
  Settings,
  User
} from "lucide-react";
import Chatbot from "@/components/Chatbot";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/crop-prediction", label: "Crop Prediction", icon: Sprout },
  { path: "/yield-prediction", label: "Yield Prediction", icon: TrendingUp },
  { path: "/disease-detection", label: "Disease Detection", icon: Bug },
  { path: "/smart-irrigation", label: "Smart Irrigation", icon: Droplets },
  { path: "/mandi-pricing", label: "Mandi Pricing", icon: ShoppingCart },
  { path: "/market-trends", label: "Market Trends", icon: TrendingUp },
  { path: "/equipment-rental", label: "Equipment Rental", icon: Tractor },
  { path: "/financial", label: "Financial Support", icon: Wallet },
  { path: "/farm-setup", label: "Farm Setup", icon: Settings },
  { path: "/profile", label: "Profile", icon: User },
];

export default function Layout({ onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-emerald-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                data-testid="mobile-menu-button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-emerald-50"
              >
                {sidebarOpen ? <X className="h-6 w-6 text-primary" /> : <Menu className="h-6 w-6 text-primary" />}
              </button>
              <h1 className="text-2xl font-bold text-primary">KrishiRakshak X</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                data-testid="chat-toggle-button"
                onClick={() => setChatOpen(!chatOpen)}
                className="rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                size="icon"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button
                data-testid="logout-button"
                onClick={onLogout}
                variant="outline"
                className="rounded-full border-2 border-primary text-primary hover:bg-primary/5"
                size="icon"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-white/70 backdrop-blur-lg border-r border-emerald-100
            w-64 z-30 transform transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-link-${item.path.replace('/', '') || 'dashboard'}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                    ${isActive
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-gray-700 hover:bg-emerald-50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Chatbot */}
      {chatOpen && <Chatbot onClose={() => setChatOpen(false)} />}

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}