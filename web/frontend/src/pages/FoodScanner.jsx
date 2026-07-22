import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import API from '../utils/api';
import { FaCamera, FaHistory, FaAppleAlt, FaExclamationTriangle, FaCheckCircle, FaExchangeAlt } from 'react-icons/fa';

const FoodScanner = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  // History logs
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch scan history
  const loadScanHistory = async () => {
    try {
      const res = await API.get('/food-scanner/history');
      if (res.data.success) {
        setHistory(res.data.scans);
      }
    } catch (err) {
      console.error('Error fetching scan history:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadScanHistory();
  }, []);

  const compressImage = (selectedFile, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], selectedFile.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            callback(compressedFile);
          },
          'image/jpeg',
          0.7
        );
      };
    };
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setLoading(true);
      compressImage(selectedFile, (compressedFile) => {
        setFile(compressedFile);
        setPreviewUrl(URL.createObjectURL(compressedFile));
        setScanResult(null); // clear previous scan
        setLoading(false);
      });
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await API.post('/food-scanner/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        setScanResult(res.data.scan.analysis);
        // Refresh history list
        loadScanHistory();
      }
    } catch (err) {
      console.error('Scan error:', err.message);
      alert('Error analyzing food image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSuitabilityColor = (suitability) => {
    switch (suitability?.toLowerCase()) {
      case 'excellent':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
      case 'moderate':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
      case 'avoid':
      default:
        return 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold font-sans">AI Diet & Food Scanner</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Upload an image of your meal to analyze calories, carbs breakdown, Glycemic Index (GI), and get diabetes-friendly alternatives.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Image Uploader & Analysis Results */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <h3 className="font-bold text-sm mb-4 flex items-center space-x-2">
              <FaCamera className="text-primary-500 text-xs" />
              <span>Upload Meal Image</span>
            </h3>

            <form onSubmit={handleScanSubmit} className="space-y-5">
              {/* Drag/Drop area */}
              <div className="relative border-2 border-dashed border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors flex flex-col items-center justify-center min-h-[200px]">
                {previewUrl ? (
                  <div className="relative w-full max-h-60 rounded-xl overflow-hidden shadow-md">
                    <img src={previewUrl} alt="Meal preview" className="w-full h-full object-contain max-h-60" />
                    <button 
                      type="button" 
                      onClick={() => { setFile(null); setPreviewUrl(null); setScanResult(null); }}
                      className="absolute top-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full p-2 text-xs transition-colors"
                    >
                      &times; Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center space-y-3 py-6">
                    <div className="p-4 bg-primary-500/5 rounded-full text-primary-500">
                      <FaCamera className="text-3xl" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Click to upload image</span>
                      <span className="block text-[10px] text-slate-400 mt-1">Supports PNG, JPG (Max 5MB)</span>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {file && !scanResult && (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 rounded-xl text-xs font-bold"
                >
                  {loading ? 'Analyzing with Google Gemini Vision...' : 'Analyze Meal Composition'}
                </button>
              )}
            </form>
          </GlassCard>

          {/* Loader */}
          {loading && (
            <LoadingSkeleton count={3} height="h-24" />
          )}

          {/* Analysis Result Box */}
          {scanResult && (
            <GlassCard className="space-y-6 text-left">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/30 dark:border-slate-800/30 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">{scanResult.foodName}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gemini Vision Assessment</span>
                </div>
                <span className={`px-4 py-2 border rounded-xl font-bold text-xs ${getSuitabilityColor(scanResult.diabeticSuitability)}`}>
                  {scanResult.diabeticSuitability === 'Excellent' && <FaCheckCircle className="inline mr-1 text-xs" />}
                  {scanResult.diabeticSuitability === 'Avoid' && <FaExclamationTriangle className="inline mr-1 text-xs" />}
                  Suitability: {scanResult.diabeticSuitability}
                </span>
              </div>

              {/* Macro nutrition grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/20 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-400">CALORIES</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">{scanResult.calories} kcal</span>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/20 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-400">CARBS</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">{scanResult.carbsGrams}g</span>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/20 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-400">PROTEIN</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">{scanResult.proteinGrams}g</span>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/20 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-400">FAT</span>
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">{scanResult.fatGrams}g</span>
                </div>
              </div>

              {/* Glycemic Index Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400">GLYCEMIC INDEX (GI)</span>
                    <span className="text-sm font-black text-orange-500">{scanResult.glycemicIndex}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full" style={{ width: `${Math.min(100, scanResult.glycemicIndex)}%` }}></div>
                  </div>
                  <span className="block text-[9px] text-slate-400 mt-1.5">
                    {scanResult.glycemicIndex <= 55 ? 'Low GI (Good)' : scanResult.glycemicIndex <= 69 ? 'Medium GI (Caution)' : 'High GI (Risk)'}
                  </span>
                </div>

                <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400">GLYCEMIC LOAD (GL)</span>
                    <span className="text-sm font-black text-purple-500">{scanResult.glycemicLoad}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${Math.min(100, scanResult.glycemicLoad * 5)}%` }}></div>
                  </div>
                  <span className="block text-[9px] text-slate-400 mt-1.5">
                    {scanResult.glycemicLoad <= 10 ? 'Low GL (Good)' : scanResult.glycemicLoad <= 19 ? 'Medium GL (Caution)' : 'High GL (Risk)'}
                  </span>
                </div>
              </div>

              {/* Clinical Analysis Text */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/20">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">AI Nutritionist Analysis</h4>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{scanResult.clinicalAnalysis}</p>
              </div>

              {/* Alternatives List */}
              {scanResult.healthyAlternatives?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <FaExchangeAlt className="text-primary-500 text-xs" />
                    <span>Recommended Diabetic-Friendly Alternatives</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {scanResult.healthyAlternatives.map((alt, idx) => (
                      <div key={idx} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start space-x-2 text-xs">
                        <FaAppleAlt className="text-emerald-500 mt-0.5" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{alt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          )}
        </div>

        {/* Right Column: Scan Logs History */}
        <div>
          <GlassCard className="h-full flex flex-col p-6 max-h-[600px] overflow-hidden">
            <h3 className="font-bold text-sm mb-4 flex items-center space-x-2">
              <FaHistory className="text-primary-500 text-xs" />
              <span>Scanning Logs History</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin">
              {historyLoading ? (
                <LoadingSkeleton count={4} height="h-14" />
              ) : history.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">No logs scanned yet. Analyze your first meal above!</p>
              ) : (
                history.map((scan) => (
                  <div 
                    key={scan.id} 
                    onClick={() => setScanResult(scan.analysis)}
                    className="p-3 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-900/70 border border-slate-200/20 rounded-xl text-left cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs truncate max-w-[130px]">{scan.analysis.foodName}</span>
                      <span className={`text-[9px] px-2 py-0.5 border rounded-lg font-bold uppercase ${
                        scan.analysis.diabeticSuitability === 'Excellent' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        scan.analysis.diabeticSuitability === 'Moderate' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                        'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {scan.analysis.diabeticSuitability}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{scan.analysis.calories} kcal</span>
                      <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};

export default FoodScanner;
