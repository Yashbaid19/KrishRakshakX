import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-100">
      <div className="bg-red-50 p-4 rounded-full mb-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
      <p className="text-gray-600 mb-6 text-center max-w-md">{message || "Failed to load data. Please try again."}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          className="rounded-full bg-primary hover:bg-primary/90"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100">
      {Icon && (
        <div className="bg-gray-50 p-4 rounded-full mb-4">
          <Icon className="h-12 w-12 text-gray-400" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md">{description}</p>
    </div>
  );
}

export function OfflineState() {
  return (
    <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
      <WifiOff className="h-5 w-5 text-yellow-600" />
      <div>
        <p className="text-sm font-medium text-yellow-900">You're offline</p>
        <p className="text-xs text-yellow-700">Some features may not work properly</p>
      </div>
    </div>
  );
}