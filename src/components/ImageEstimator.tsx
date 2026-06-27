'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Camera, Upload, CheckCircle, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

interface GeminiEstimation {
  foodFound: boolean;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  hallucinationRiskNote?: string;
}

export default function ImageEstimator({ onLogSaved }: { onLogSaved: () => void }) {
  const { fetchWithAuth } = useAuth();
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimation, setEstimation] = useState<GeminiEstimation | null>(null);

  // Editable fields for manual review to handle hallucinations
  const [editableName, setEditableName] = useState('');
  const [editableCalories, setEditableCalories] = useState(0);
  const [editableProtein, setEditableProtein] = useState(0);
  const [editableCarbs, setEditableCarbs] = useState(0);
  const [editableFat, setEditableFat] = useState(0);
  
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert uploaded image file to Base64 format
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setEstimation(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (png, jpeg, webp)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;

    setError(null);
    setAnalyzing(true);
    setEstimation(null);

    try {
      const res = await fetchWithAuth('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze image');
      }

      if (!data.foodFound) {
        throw new Error('No food or meal could be identified in this image. Please upload a clear picture of your food.');
      }

      setEstimation(data);
      setEditableName(data.name || '');
      setEditableCalories(data.calories || 0);
      setEditableProtein(data.protein || 0);
      setEditableCarbs(data.carbs || 0);
      setEditableFat(data.fat || 0);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveLog = async () => {
    if (!editableName) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetchWithAuth('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'food',
          name: editableName,
          date: new Date(),
          caloriesIn: editableCalories,
          protein: editableProtein,
          carbs: editableCarbs,
          fat: editableFat,
          mealType: mealType,
          image: imagePreview,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save log');
      }

      // Reset state
      setImagePreview(null);
      setEstimation(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onLogSaved();
    } catch (err: any) {
      setError(err.message || 'Saving log failed.');
    } finally {
      setSaving(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Camera className="h-5 w-5 text-red-400" />
        AI Photo Scanner
      </h3>

      {/* Select Meal Category */}
      <div className="flex gap-2 mb-6">
        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setMealType(type)}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold uppercase tracking-wider border capitalize transition-all duration-200 ${
              mealType === type
                ? 'bg-red-500 border-red-500 text-slate-950 shadow-md shadow-red-500/10'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Drag & Drop Zone */}
      {!imagePreview && (
        <div
          onClick={triggerUpload}
          className="border-2 border-dashed border-slate-800 hover:border-red-500/50 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-950/20 hover:bg-slate-950/40 transition-all duration-300 group"
        >
          <div className="h-12 w-12 rounded-full bg-slate-900/80 flex items-center justify-center border border-slate-800 group-hover:border-red-500/30 group-hover:text-red-400 text-slate-400 transition-colors">
            <Upload className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">Upload food photo</p>
            <p className="text-xs text-slate-500 mt-1">PNG, JPG, or WEBP up to 5MB</p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      )}

      {/* Preview and Analysis controls */}
      {imagePreview && !estimation && (
        <div className="space-y-4">
          <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800">
            <img src={imagePreview} alt="Food Upload Preview" className="object-cover w-full h-full" />
            <button
              onClick={() => {
                setImagePreview(null);
                setError(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-2 right-2 rounded-lg bg-slate-950/80 hover:bg-slate-950 border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex w-full justify-center items-center rounded-xl bg-red-500 hover:bg-red-400 active:bg-red-600 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 shadow-md shadow-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gemini Analyzing...
              </>
            ) : (
              'Scan Calories'
            )}
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-955/20 border border-red-900/50 p-4 text-xs text-red-400 mt-4">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Estimation confirmation inputs to prevent hallucinations */}
      {estimation && (
        <div className="mt-4 space-y-4 border-t border-slate-800/60 pt-4">
          <div className="rounded-xl bg-slate-900/60 p-4 border border-slate-800">
            <div className="flex justify-between items-center text-xs mb-3">
              <span className="text-slate-400">Gemini Confidence</span>
              <span className={`font-bold px-2 py-0.5 rounded-full ${
                estimation.confidence > 0.75
                  ? 'bg-emerald-950/80 text-emerald-400'
                  : 'bg-amber-955/80 text-amber-400'
              }`}>
                {Math.round(estimation.confidence * 100)}%
              </span>
            </div>

            {estimation.hallucinationRiskNote && (
              <div className="flex gap-2 text-[11px] text-amber-400 leading-relaxed bg-amber-950/20 border border-amber-900/40 rounded-lg p-2.5 mb-4">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span><strong>Hallucination Precaution:</strong> {estimation.hallucinationRiskNote}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Item Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Adjust Food Name
                </label>
                <input
                  type="text"
                  value={editableName}
                  onChange={(e) => setEditableName(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Calories */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Estimated Calories (kcal)
                </label>
                <input
                  type="number"
                  value={editableCalories}
                  onChange={(e) => setEditableCalories(Number(e.target.value))}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Macros grid */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 text-center">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={editableProtein}
                    onChange={(e) => setEditableProtein(Number(e.target.value))}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 text-center">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    value={editableCarbs}
                    onChange={(e) => setEditableCarbs(Number(e.target.value))}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 text-center">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    value={editableFat}
                    onChange={(e) => setEditableFat(Number(e.target.value))}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setEstimation(null);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="flex-1 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSaveLog}
              disabled={saving}
              className="flex-1 flex justify-center items-center rounded-xl bg-red-500 hover:bg-red-400 active:bg-red-600 py-2.5 text-xs font-semibold text-slate-950 transition-all duration-200"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1.5 shrink-0" />
                  Save Meal Log
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
