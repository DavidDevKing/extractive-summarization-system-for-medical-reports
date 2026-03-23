import { useState } from 'react';
import axios from 'axios';
import { Activity, FileText, Stethoscope, ChevronRight, Loader2, Settings } from 'lucide-react';

export default function ClinicalSummarizer() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  // 1. Added state for the sentence count (defaulting to 5)
  const [numSentences, setNumSentences] = useState(5);

  const handleSummarize = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setSummary('');
    setMetrics(null);

    try {
      const response = await axios.post('https://moseleydev-medical-report-extractive-summarizer.hf.space/api/summarize', {
        text: inputText,
        num_sentences: numSentences
      });

      setSummary(response.data.summary);
      setMetrics(response.data.metadata);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      setSummary("Error connecting to the NLP engine. Please ensure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-teal-600 p-3 rounded-lg text-white">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Clinical Triage Engine</h1>
            <p className="text-sm text-slate-500">Powered by SciBERT Extractive Summarization</p>
          </div>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Input Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">

            {/* 3. Added the settings control to the panel header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-700">
                <FileText size={18} />
                <h2 className="font-semibold">Raw Medical Report</h2>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Settings size={14} className="text-slate-500" />
                <label htmlFor="sentenceCount" className="text-sm font-medium text-slate-600">
                  Sentences:
                </label>
                <input
                  id="sentenceCount"
                  type="number"
                  min="1"
                  max="15"
                  value={numSentences}
                  onChange={(e) => setNumSentences(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 bg-transparent text-center text-sm font-semibold text-teal-700 focus:outline-none focus:ring-0 p-0 border-none"
                />
              </div>
            </div>

            <textarea
              className="w-full h-96 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none text-slate-700 leading-relaxed"
              placeholder="Paste patient history, lab results, or clinical notes here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              onClick={handleSummarize}
              disabled={isLoading || !inputText}
              className="mt-4 w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="animate-spin" size={20} /> Processing via SciBERT...</>
              ) : (
                <>Extract Core Findings <ChevronRight size={20} /></>
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-teal-700">
                <Activity size={18} />
                <h2 className="font-semibold">Extracted Summary</h2>
              </div>

              {/* Metrics Badge */}
              {metrics && (
                <span className="bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 rounded-full border border-teal-100">
                  {metrics.processing_time_ms}ms • {metrics.engine}
                </span>
              )}
            </div>

            <div className={`flex-1 p-6 rounded-lg border ${summary ? 'bg-teal-50/30 border-teal-100' : 'bg-slate-50 border-slate-100 flex items-center justify-center'}`}>
              {summary ? (
                <div className="space-y-4">
                  <p className="text-slate-800 leading-relaxed text-lg">
                    {summary}
                  </p>

                  {metrics && metrics.original_length && (
                    <div className="pt-4 mt-6 border-t border-teal-100 flex gap-4 text-sm text-slate-500">
                      <p>Original: <b>{metrics.original_length}</b> sentences</p>
                      <p>Condensed to: <b>{metrics.summary_length}</b> sentences</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-center">
                  The summarized clinical facts will appear here.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}