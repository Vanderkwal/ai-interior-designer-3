
import React, { useState, useRef } from 'react';
import { ParsedQuestion, ProcessingStatus } from './types';
import { convertContentToQuestions } from './services/geminiService';
import { generateAnsCsv } from './services/csvBuilder';
import { Button } from './components/Button';

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({ step: 'idle' });
  const [resultQuestions, setResultQuestions] = useState<ParsedQuestion[] | null>(null);
  const [csvOutput, setCsvOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Added handleFileChange to fix the reference error on line 138
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const processData = async () => {
    setStatus({ step: 'reading', message: 'Invoer wordt verwerkt door de Senior Specialist...' });
    setResultQuestions(null);
    setCsvOutput('');

    try {
      let questions: ParsedQuestion[] = [];

      if (activeTab === 'text') {
        if (!inputText.trim()) throw new Error("Voer eerst tekst in.");
        setStatus({ step: 'analyzing', message: 'Anti-testwiseness screening & de-duplicatie...' });
        questions = await convertContentToQuestions(inputText, 'text');
      } else {
        if (!selectedFile) throw new Error("Selecteer eerst een bestand.");
        const base64 = await readFileAsBase64(selectedFile);
        setStatus({ step: 'analyzing', message: 'Document analyse & validatie...' });
        questions = await convertContentToQuestions(base64, 'base64', selectedFile.type);
      }

      setStatus({ step: 'building', message: 'CSV Generatie (34-koloms protocol)...' });
      const csv = generateAnsCsv(questions);

      setResultQuestions(questions);
      setCsvOutput(csv);
      setStatus({ step: 'complete', message: '✅ Conversie en Validatie Voltooid.' });

    } catch (err: any) {
      setStatus({ step: 'error', message: err.message || "Er is een fout opgetreden tijdens de validatie." });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(csvOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCsv = () => {
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ans_import_specialist.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-slate-900 shadow-lg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-blue-500 rounded flex items-center justify-center text-white font-black text-xl shadow-inner">ANS</div>
             <div>
               <h1 className="text-xl font-bold leading-tight">Senior Data-Specialist</h1>
               <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Conversie & Validatie Pro</p>
             </div>
          </div>
          <div className="hidden sm:block text-xs bg-slate-800 text-blue-300 px-4 py-2 rounded border border-slate-700">
             Strict 34-Column Protocol Active
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        <div className="bg-white border-l-4 border-blue-500 shadow-sm rounded-r-lg p-5 mb-8">
          <p className="text-slate-700 text-sm leading-relaxed">
            <strong>Welkom.</strong> Plak hieronder uw vragen of upload een document. Ik zal de vragen screenen op
            <span className="text-blue-600 font-semibold"> anti-testwiseness</span>,
            <span className="text-blue-600 font-semibold"> visuele consistentie</span> en
            <span className="text-blue-600 font-semibold"> de-duplicatie</span>.
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-xl overflow-hidden mb-8 border border-slate-200">
          <div className="bg-slate-50 px-4 border-b border-slate-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('text')}
                className={`py-4 px-1 border-b-2 font-bold text-sm transition-all ${
                  activeTab === 'text' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                TEKST INVOER
              </button>
              <button
                onClick={() => setActiveTab('file')}
                className={`py-4 px-1 border-b-2 font-bold text-sm transition-all ${
                  activeTab === 'file' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                DOCUMENT UPLOAD
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'text' ? (
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Plak hier de ruwe vragen... (bijv. vanuit NotebookLM)"
                className="w-full h-80 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm shadow-inner"
              />
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-xl h-80 flex flex-col items-center justify-center bg-slate-50 transition-colors hover:bg-slate-100">
                <input type="file" accept=".pdf,.docx,.doc,.txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <div className="text-center">
                  <div className="bg-white p-4 rounded-full shadow-md inline-block mb-4">
                    <svg className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium">
                    {selectedFile ? <span className="text-blue-600">{selectedFile.name}</span> : "Selecteer PDF of Word document"}
                  </p>
                  <Button variant="secondary" className="mt-4 shadow-sm" onClick={() => fileInputRef.current?.click()}>
                    Kies Bestand
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center">
               <Button
                 className="px-10 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                 onClick={processData}
                 isLoading={status.step !== 'idle' && status.step !== 'complete' && status.step !== 'error'}
               >
                 Start Validatie & Conversie
               </Button>
            </div>

            {status.message && (
              <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${status.step === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                {status.step === 'complete' ? '✨' : '⏳'}
                <span className="font-medium">{status.message}</span>
              </div>
            )}
          </div>
        </div>

        {status.step === 'complete' && csvOutput && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800">
              <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="ml-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ANS Import Code Block</span>
                </div>
                <div className="flex gap-2">
                  <Button variant={copied ? "success" : "secondary"} className="text-xs py-1" onClick={copyToClipboard}>
                    {copied ? "Gekopieerd! ✓" : "Kopiëren"}
                  </Button>
                  <Button variant="success" className="text-xs py-1" onClick={downloadCsv}>Download .csv</Button>
                </div>
              </div>
              <textarea
                readOnly
                value={csvOutput}
                className="w-full h-96 p-6 bg-transparent text-emerald-400 font-mono text-sm resize-none focus:ring-0"
              />
              <div className="px-6 py-3 bg-slate-800 text-slate-400 text-xs flex justify-between items-center italic">
                <span>✅ CSV Gevalideerd en Gereed. Klik op 'Copy' of 'Download'. Er zijn geen dubbele antwoordopties aanwezig.</span>
                <span>{resultQuestions?.length || 0} items verwerkt</span>
              </div>
            </div>

            {/* Minimal Preview for Validation Confidence */}
            <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Validatie Preview</h3>
               <div className="space-y-4">
                 {resultQuestions?.map((q, i) => (
                   <div key={i} className="flex gap-4 text-xs border-b border-slate-100 pb-3 last:border-0">
                     <span className="font-mono text-slate-400">{q.id}</span>
                     <div className="flex-1">
                       <p className="font-medium text-slate-800 mb-1">{q.questionText}</p>
                       <div className="flex gap-4">
                         <span className="text-blue-600">🏷️ {q.topic}</span>
                         <span className="text-indigo-600">🧠 {q.bloom}</span>
                         <span className="text-slate-500">📊 {q.difficulty}</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
