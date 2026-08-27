import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Copy,
  Check,
  UploadCloud,
  Trash2,
  AlertTriangle,
  X,
  RefreshCw,
  Calendar,
  Terminal,
  ChevronDown,
  ChevronUp,
  Download,
  Megaphone,
} from 'lucide-react';

const API_URL = 'https://caption-generator-sq0k.onrender.com/generate';

const PLATFORM_OPTIONS = [
  { id: 'Instagram', label: 'Instagram', tag: 'Visual & Tags', color: 'border-pink-200 bg-pink-50 text-pink-700' },
  { id: 'LinkedIn', label: 'LinkedIn', tag: 'Professional B2B', color: 'border-sky-200 bg-sky-50 text-sky-800' },
  { id: 'Twitter', label: 'Twitter / X', tag: 'Short & Punchy', color: 'border-neutral-300 bg-neutral-100 text-neutral-800' },
  { id: 'Facebook', label: 'Facebook', tag: 'Conversational', color: 'border-blue-200 bg-blue-50 text-blue-700' },
  { id: 'TikTok', label: 'TikTok', tag: 'Hooks & Trends', color: 'border-teal-200 bg-teal-50 text-teal-800' },
];

interface GeneratedResponse {
  client_name: string;
  generated_posts: Record<string, string>;
  schedule_time: string;
  logs?: string[];
}

export default function App() {
  const [clientName, setClientName] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Instagram', 'LinkedIn', 'Twitter']);
  const [scheduledDate, setScheduledDate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const [result, setResult] = useState<GeneratedResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      setElapsedSeconds(0);
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageChange = (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const togglePlatform = (pId: string) => {
    if (isLoading) return;
    if (selectedPlatforms.includes(pId)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== pId));
    } else {
      setSelectedPlatforms([...selectedPlatforms, pId]);
    }
    setValidationErrors((prev) => ({ ...prev, platforms: '' }));
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!clientName.trim()) {
      errs.clientName = 'Client or brand name is required.';
    }
    if (!adDescription.trim()) {
      errs.adDescription = 'Ad description is required.';
    }
    if (selectedPlatforms.length === 0) {
      errs.platforms = 'Please select at least one social media platform.';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorDetail(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('client_name', clientName.trim());
      formData.append('ad_description', adDescription.trim());
      formData.append('platforms', selectedPlatforms.join(','));
      formData.append('scheduled_date', scheduledDate.trim() || 'ASAP');

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let msg = `Server returned HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.detail) {
            msg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch {
          const text = await res.text();
          if (text) msg = text;
        }
        throw new Error(msg);
      }

      const data: GeneratedResponse = await res.json();
      setResult(data);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error('API call failed:', err);
      let message = err?.message || 'Failed to communicate with the caption generator backend.';
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        message =
          'Network connection error. If the backend on Render was asleep (cold start), it can take ~30-45s to boot. Please wait a moment and try submitting again.';
      }
      setErrorDetail(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCaption = async (platform: string, text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedKey(platform);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Clipboard copy error', err);
    }
  };

  const handleCopyAll = async () => {
    if (!result?.generated_posts) return;
    const all = Object.entries(result.generated_posts)
      .map(([p, t]) => `=== ${p.toUpperCase()} ===\n${t}\n`)
      .join('\n');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(all);
      } else {
        const ta = document.createElement('textarea');
        ta.value = all;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    } catch (err) {
      console.error('Copy all error', err);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const content = `MARKETING CAPTIONS GENERATED FOR: ${result.client_name}
SCHEDULED: ${result.schedule_time || 'ASAP'}
GENERATED AT: ${new Date().toLocaleString()}
-------------------------------------------

${Object.entries(result.generated_posts || {})
  .map(([p, t]) => `[${p.toUpperCase()}]\n${t}\n\n`)
  .join('')}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.client_name.replace(/\s+/g, '_')}_captions.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    handleImageChange(null);
    setClientName('');
    setAdDescription('');
    setSelectedPlatforms(['Instagram', 'LinkedIn', 'Twitter']);
    setScheduledDate('');
    setResult(null);
    setErrorDetail(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans pb-16">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-900 leading-tight">
                AI Marketing Caption Generator
              </h1>
              <p className="text-xs text-neutral-500 font-mono">
                Live API: <span className="text-indigo-600">caption-generator-sq0k.onrender.com</span>
              </p>
            </div>
          </div>

          {result && (
            <button
              id="new-caption-btn"
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Start New
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
        {errorDetail && (
          <div
            id="error-banner"
            role="alert"
            className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 shadow-xs flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-red-900">Request Error</h3>
              <p className="text-sm text-red-700 mt-0.5 leading-relaxed break-words">{errorDetail}</p>
              <button
                id="retry-btn"
                type="button"
                onClick={() => handleSubmit()}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Request
              </button>
            </div>
            <button
              id="dismiss-error-btn"
              type="button"
              onClick={() => setErrorDetail(null)}
              className="text-red-500 hover:text-red-800 p-1 rounded cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div id="generator-form-container" className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="client_name_input" className="text-sm font-bold text-neutral-800">
                  Client / Brand Name <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-neutral-400">string (form field)</span>
              </div>
              <input
                id="client_name_input"
                name="client_name"
                type="text"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  if (validationErrors.clientName) setValidationErrors((prev) => ({ ...prev, clientName: '' }));
                }}
                disabled={isLoading}
                placeholder="e.g. Acme Shoes, FinTech Corp, Bloom Coffee"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition-all ${
                  validationErrors.clientName
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-neutral-300 focus:border-indigo-500 focus:ring-indigo-100'
                } disabled:bg-neutral-50`}
              />
              {validationErrors.clientName && (
                <p className="text-xs text-red-600 mt-1 font-medium">{validationErrors.clientName}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="ad_description_input" className="text-sm font-bold text-neutral-800">
                  Ad Description / Campaign Pitch <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-neutral-400">textarea (form field)</span>
              </div>
              <textarea
                id="ad_description_input"
                name="ad_description"
                rows={4}
                value={adDescription}
                onChange={(e) => {
                  setAdDescription(e.target.value);
                  if (validationErrors.adDescription) setValidationErrors((prev) => ({ ...prev, adDescription: '' }));
                }}
                disabled={isLoading}
                placeholder="Describe your product, core benefits, promotional offers, target audience, and call to action..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition-all ${
                  validationErrors.adDescription
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-neutral-300 focus:border-indigo-500 focus:ring-indigo-100'
                } disabled:bg-neutral-50`}
              />
              {validationErrors.adDescription && (
                <p className="text-xs text-red-600 mt-1 font-medium">{validationErrors.adDescription}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-neutral-800">
                  Platforms <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatforms(PLATFORM_OPTIONS.map((p) => p.id))}
                    disabled={isLoading || selectedPlatforms.length === PLATFORM_OPTIONS.length}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer disabled:opacity-40"
                  >
                    Select All
                  </button>
                  <span className="text-neutral-300 text-xs">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPlatforms([])}
                    disabled={isLoading || selectedPlatforms.length === 0}
                    className="text-xs text-neutral-500 hover:text-neutral-800 font-medium cursor-pointer disabled:opacity-40"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div
                id="platform-checkboxes"
                className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 ${
                  validationErrors.platforms ? 'p-2 rounded-xl border border-red-300 bg-red-50/30' : ''
                }`}
              >
                {PLATFORM_OPTIONS.map((opt) => {
                  const isChecked = selectedPlatforms.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      id={`platform-label-${opt.id.toLowerCase()}`}
                      className={`flex flex-col justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        isChecked
                          ? 'bg-indigo-50/70 border-indigo-500 shadow-2xs'
                          : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-900">{opt.label}</span>
                        <input
                          type="checkbox"
                          id={`checkbox-${opt.id.toLowerCase()}`}
                          name="platforms"
                          value={opt.id}
                          checked={isChecked}
                          onChange={() => togglePlatform(opt.id)}
                          disabled={isLoading}
                          className="w-4 h-4 text-indigo-600 rounded border-neutral-300 focus:ring-indigo-500"
                        />
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-2 font-medium">{opt.tag}</span>
                    </label>
                  );
                })}
              </div>
              {validationErrors.platforms && (
                <p className="text-xs text-red-600 mt-1.5 font-medium">{validationErrors.platforms}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="scheduled_date_input" className="text-sm font-bold text-neutral-800">
                    Scheduled Date <span className="text-xs font-normal text-neutral-500">(optional)</span>
                  </label>
                  <span className="text-xs text-neutral-400">Defaults to &quot;ASAP&quot;</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      id="scheduled_date_input"
                      name="scheduled_date"
                      type="text"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      disabled={isLoading}
                      placeholder="e.g. ASAP, Tomorrow 10am, 2026-09-01"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-neutral-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setScheduledDate('ASAP')}
                    disabled={isLoading || scheduledDate === 'ASAP'}
                    className="px-3 py-2 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-colors shrink-0 disabled:opacity-40 cursor-pointer"
                  >
                    ASAP
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-neutral-800">
                    Ad Image Context <span className="text-xs font-normal text-neutral-500">(optional)</span>
                  </label>
                  <span className="text-xs text-neutral-400">accept=&quot;image/*&quot;</span>
                </div>

                <input
                  id="image_input"
                  ref={fileInputRef}
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                  disabled={isLoading}
                  className="hidden"
                />

                {!imagePreview ? (
                  <button
                    id="trigger-image-upload-btn"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full py-2.5 px-3 border border-dashed border-neutral-300 rounded-xl bg-neutral-50 hover:bg-white hover:border-indigo-400 transition-colors flex items-center justify-center gap-2 text-neutral-600 text-xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4 text-indigo-600" />
                    <span>Upload image (PNG, JPG, WebP)</span>
                  </button>
                ) : (
                  <div
                    id="image-preview-box"
                    className="flex items-center gap-3 p-2 border border-neutral-200 rounded-xl bg-neutral-50"
                  >
                    <img
                      src={imagePreview}
                      alt="Thumbnail preview"
                      className="w-10 h-10 object-cover rounded-lg border border-neutral-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-800 truncate">
                        {imageFile?.name || 'Attached Image'}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                    <button
                      id="remove-image-btn"
                      type="button"
                      onClick={() => handleImageChange(null)}
                      disabled={isLoading}
                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Sends actual FormData to POST /generate</span>
              </div>

              <button
                id="submit-generate-btn"
                type="submit"
                disabled={isLoading}
                className={`w-full sm:w-auto min-w-[220px] px-6 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                  isLoading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-indigo-200 hover:shadow-md'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Running LLM ({elapsedSeconds}s)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Captions</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {isLoading && (
            <div id="loading-progress" className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>Generating copy across {selectedPlatforms.length} platforms...</span>
              </div>
              <span className="font-mono font-bold text-indigo-700">{elapsedSeconds}s</span>
            </div>
          )}
        </div>

        {result && (
          <div ref={resultsRef} id="results-container" className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-lg">
                  Client: <strong className="text-neutral-900">{result.client_name}</strong>
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  Schedule: <strong>{result.schedule_time || 'ASAP'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  id="copy-all-btn"
                  type="button"
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  {allCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{allCopied ? 'All Copied' : 'Copy All'}</span>
                </button>

                <button
                  id="export-file-btn"
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {Object.entries(result.generated_posts || {}).map(([platform, text], idx) => {
                const isCopied = copiedKey === platform;
                const charCount = text.length;
                const hashtagCount = (text.match(/#[\w\u0590-\u05ff]+/g) || []).length;
                const opt = PLATFORM_OPTIONS.find((o) => o.id.toLowerCase() === platform.toLowerCase());

                return (
                  <div
                    key={platform}
                    id={`result-card-${platform.toLowerCase()}`}
                    className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden"
                  >
                    <div className="px-5 py-3 bg-neutral-50/80 border-b border-neutral-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${
                            opt ? opt.color : 'bg-neutral-100 text-neutral-800 border-neutral-200'
                          }`}
                        >
                          {platform}
                        </span>
                        <span className="text-xs text-neutral-400 hidden sm:inline">Post #{idx + 1}</span>
                      </div>

                      <button
                        id={`copy-btn-${platform.toLowerCase()}`}
                        type="button"
                        onClick={() => handleCopyCaption(platform, text)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Copy to clipboard</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="text-neutral-800 text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
                        {text}
                      </div>

                      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
                        <div className="flex items-center gap-3">
                          <span>{charCount} characters</span>
                          {hashtagCount > 0 && (
                            <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] font-medium">
                              #{hashtagCount} hashtags
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {result.logs && result.logs.length > 0 && (
              <div className="bg-neutral-900 text-neutral-200 rounded-2xl p-4 text-xs font-mono border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowLogs(!showLogs)}
                  className="w-full flex items-center justify-between text-neutral-300 hover:text-white cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-neutral-200">Server Execution Logs</span>
                    <span className="bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded text-[11px]">
                      {result.logs.length} logs
                    </span>
                  </div>
                  {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showLogs && (
                  <div className="mt-3 pt-3 border-t border-neutral-800 space-y-1.5">
                    {result.logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-neutral-500">{i + 1}.</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
