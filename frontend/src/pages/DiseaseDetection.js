import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DiseaseDetection() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await axios.post(`${API}/disease/detect`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setResult(response.data);
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "High": return "bg-red-100 text-red-800 border-red-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">Disease Detection</h1>
        <p className="text-base text-muted-foreground">Upload a leaf image for AI-powered disease diagnosis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <h2 className="text-2xl font-semibold mb-6">Upload Leaf Image</h2>

          {!preview ? (
            <div className="space-y-4">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-emerald-300 rounded-2xl cursor-pointer bg-gradient-to-br from-white to-emerald-50 hover:bg-emerald-50 transition-colors duration-300"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-12 w-12 text-primary mb-4" />
                  <p className="mb-2 text-sm text-gray-600 font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 10MB)</p>
                </div>
                <input
                  id="file-upload"
                  data-testid="disease-image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">Or</p>
                <label htmlFor="camera-upload">
                  <Button
                    data-testid="camera-capture-button"
                    type="button"
                    variant="outline"
                    className="rounded-full border-2 border-primary text-primary hover:bg-primary/5 w-full"
                    onClick={() => document.getElementById('camera-upload').click()}
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Use Camera
                  </Button>
                </label>
                <input
                  id="camera-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={preview}
                  alt="Selected leaf"
                  className="w-full h-64 object-cover rounded-2xl"
                />
                <Button
                  data-testid="remove-image-button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    setResult(null);
                  }}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full"
                >
                  <AlertCircle className="h-4 w-4" />
                </Button>
              </div>

              <Button
                data-testid="analyze-disease-button"
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg py-6 text-lg font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Disease"
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <Card
                data-testid="disease-result-card"
                className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6"
              >
                <h2 className="text-2xl font-semibold mb-4">Detection Results</h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Detected Disease</p>
                    <h3 className="text-2xl font-bold text-primary">{result.disease}</h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Confidence</p>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${result.confidence}%` }}
                          />
                        </div>
                        <span className="font-bold">{result.confidence.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Severity</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(result.severity)}`}>
                        {result.severity}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
                <h2 className="text-xl font-semibold mb-4">Recommended Treatment</h2>
                <p className="text-base leading-relaxed text-gray-700">{result.treatment}</p>
              </Card>
            </>
          ) : (
            <Card className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-12 text-center h-full flex items-center justify-center">
              <div>
                <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Upload a leaf image to detect diseases</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Info Section */}
      <Card className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl shadow-sm border border-emerald-100 p-6">
        <h3 className="text-lg font-semibold mb-3">Tips for Better Detection</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Use clear, well-lit images of the affected leaf</li>
          <li>• Ensure the leaf fills most of the frame</li>
          <li>• Avoid shadows and blurry images</li>
          <li>• Multiple angles can provide better diagnosis</li>
        </ul>
      </Card>
    </div>
  );
}