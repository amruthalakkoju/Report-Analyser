import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Stethoscope,
  ExternalLink,
  X,
  FileCheck,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface UploadedFileInfo {
  file: File;
  name: string;
  size: number;
}

interface SubmissionResult {
  patientName: string;
  deliveryEmail: string;
  age: string;
  filesUploaded: Array<{ name: string; size: number; type: string }>;
  timestamp: string;
}

const N8N_AGENT_URL = 'https://amruthalakkoju.app.n8n.cloud/form/add20286-bcbd-42fd-aa81-a9eda828c42d';

export default function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [files, setFiles] = useState<UploadedFileInfo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size utility
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Add files
  const handleAddFiles = (newFileList: FileList | File[]) => {
    setError(null);
    const added: UploadedFileInfo[] = [];
    const maxFileSize = 25 * 1024 * 1024; // 25MB

    for (let i = 0; i < newFileList.length; i++) {
      const file = newFileList[i];
      if (file.size > maxFileSize) {
        setError(`File "${file.name}" exceeds the 25MB limit.`);
        continue;
      }
      added.push({
        file,
        name: file.name,
        size: file.size,
      });
    }

    if (added.length > 0) {
      setFiles((prev) => [...prev, ...added]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Quick helper to populate a sample medical report for immediate testing
  const handleLoadSampleReport = () => {
    setName('Jane Doe');
    setEmail('jane.doe.test@example.com');
    setAge('42');
    setError(null);

    const sampleContent = `=================================================================
DIAGNOSTIC LABORATORY SERVICES - COMPREHENSIVE METABOLIC & CBC PANEL
Patient: Jane Doe | Age: 42 | Gender: Female
Specimen Collected: 2026-09-28 | Reported: 2026-09-29
Ordering Physician: Dr. Robert Vance, MD
=================================================================

COMPLETE BLOOD COUNT (CBC):
- White Blood Cells (WBC): 6.8 x10^3/uL  (Normal: 4.5 - 11.0) -> NORMAL
- Red Blood Cells (RBC):   4.42 x10^6/uL (Normal: 4.0 - 5.2)  -> NORMAL
- Hemoglobin (Hgb):        13.5 g/dL     (Normal: 12.0 - 15.5)-> NORMAL
- Hematocrit (Hct):        41.0 %        (Normal: 37.0 - 48.0)-> NORMAL
- Platelet Count:          245 x10^3/uL  (Normal: 150 - 450)  -> NORMAL

COMPREHENSIVE METABOLIC PANEL (CMP):
- Fasting Glucose:         112 mg/dL     (Normal: 70 - 99)    -> [ELEVATED / IMPAIRED FASTING]
- Blood Urea Nitrogen:     14 mg/dL      (Normal: 7 - 20)     -> NORMAL
- Creatinine, Serum:       0.85 mg/dL    (Normal: 0.6 - 1.2)  -> NORMAL
- eGFR:                    > 90 mL/min   (Normal: > 60)       -> NORMAL
- Sodium:                  139 mmol/L    (Normal: 135 - 145)  -> NORMAL
- Potassium:               4.2 mmol/L    (Normal: 3.5 - 5.0)  -> NORMAL
- Total Bilirubin:         0.7 mg/dL     (Normal: 0.2 - 1.2)  -> NORMAL
- ALT (SGPT):              22 U/L        (Normal: 7 - 35)     -> NORMAL
- AST (SGOT):              19 U/L        (Normal: 8 - 33)     -> NORMAL

LIPID PANEL:
- Total Cholesterol:       215 mg/dL     (Normal: < 200)      -> [BORDERLINE HIGH]
- Triglycerides:           160 mg/dL     (Normal: < 150)      -> [BORDERLINE HIGH]
- HDL Cholesterol:         48 mg/dL      (Normal: > 50)       -> [SLIGHTLY LOW]
- LDL Cholesterol:         135 mg/dL     (Normal: < 100)      -> [ELEVATED]

CLINICAL IMPRESSION:
Borderline elevated lipid profile and mild fasting hyperglycemia.
Recommend lifestyle modification, follow-up HbA1c testing, and dietary consultation.
=================================================================`;

    const sampleBlob = new Blob([sampleContent], { type: 'text/plain' });
    const sampleFile = new File([sampleBlob], 'Sample_Metabolic_CBC_Panel_Report.txt', {
      type: 'text/plain',
    });

    setFiles([
      {
        file: sampleFile,
        name: sampleFile.name,
        size: sampleFile.size,
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter the patient or your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address to receive the summary.');
      return;
    }
    if (!age.trim() || isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 130) {
      setError('Please enter a valid age between 1 and 130.');
      return;
    }
    if (files.length === 0) {
      setError('Please upload at least one medical report file (PDF, TXT, or Image).');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('field-0', name.trim());
      formData.append('field-1', email.trim());
      formData.append('field-2', age.trim());

      files.forEach((f) => {
        formData.append('field-3', f.file, f.name);
      });

      const response = await fetch('/api/submit-report', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit report to AI agent.');
      }

      setSubmissionResult({
        patientName: name.trim(),
        deliveryEmail: email.trim(),
        age: age.trim(),
        filesUploaded: files.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.file.type || 'text/plain',
        })),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (err: any) {
      setError(
        err.message ||
          'Unable to reach the AI agent service. Please check your network or try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setAge('');
    setFiles([]);
    setError(null);
    setSubmissionResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (Clean nav links) — Zone 3 (Primary action) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Single text wordmark */}
          <a
            href="/"
            className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-slate-900 group"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center shadow-xs">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span>Medical Report Analyser</span>
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#overview" className="hover:text-slate-950 transition-colors">
              Overview
            </a>
            <a href="#how-it-works" className="hover:text-slate-950 transition-colors">
              How It Works
            </a>
            <a href="#submit-report" className="hover:text-slate-950 transition-colors">
              Upload Report
            </a>
            <a href="#clinical-notice" className="hover:text-slate-950 transition-colors">
              Safety & Disclaimer
            </a>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3">
            <a
              href="#submit-report"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              Analyse Report
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section id="overview" className="py-16 md:py-20 border-b border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* Clean unboxed metadata separator */}
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500 mb-4">
              <span>Automated n8n AI Agent</span>
              <span aria-hidden="true">·</span>
              <span>Intelligent Clinical Synthesis</span>
              <span aria-hidden="true">·</span>
              <span>Direct Email Delivery</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 max-w-2xl mx-auto leading-tight">
              Get your medical summary in minutes.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Upload your laboratory blood work, imaging summaries, or clinical reports.
              Our automated AI agent processes complex biomarkers and delivers an easy-to-understand,
              structured summary directly to your email.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#submit-report"
                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Upload Your Medical Report</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <a
                href={N8N_AGENT_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="w-full sm:w-auto px-5 py-3 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>View Hosted Agent Workflow</span>
                <ExternalLink className="w-4 h-4 text-slate-500" />
              </a>
            </div>

            {/* Trust Markers */}
            <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                    Confidential Transmission
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    Files are transmitted via encrypted pipelines solely for automated parsing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                    Rapid Generation
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    Reports are analyzed by the AI agent and dispatched directly to your inbox.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                    Doctor-Discussion Ready
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    Translates medical jargon into plain language with suggested follow-up questions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-14 border-b border-slate-200 bg-slate-50/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
                Step-by-Step Workflow
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                How the Medical Report Analyser Works
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <span className="text-xs font-mono font-semibold text-sky-700 tracking-wider">
                  01
                </span>
                <h3 className="text-base font-semibold text-slate-900 mt-2">
                  Upload Documents
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Provide your patient details and attach blood panels, pathology results,
                  or clinical test summaries in PDF, image, or text format.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <span className="text-xs font-mono font-semibold text-sky-700 tracking-wider">
                  02
                </span>
                <h3 className="text-base font-semibold text-slate-900 mt-2">
                  AI Agent Ingestion
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  The automated n8n cloud workflow extracts clinical measurements, compares
                  them to standard reference intervals, and highlights critical flags.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <span className="text-xs font-mono font-semibold text-sky-700 tracking-wider">
                  03
                </span>
                <h3 className="text-base font-semibold text-slate-900 mt-2">
                  Receive Your Summary
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  A personalized clinical digest with layman explanations and practical questions
                  is delivered straight to your specified email address.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Agent Submission Form Section */}
        <section id="submit-report" className="py-16 bg-white">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
              {submissionResult ? (
                /* Success State */
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Report Received Successfully
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                    Your medical document has been forwarded to the AI agent workflow.
                    The automated summary is being processed and will be sent to your inbox.
                  </p>

                  <div className="mt-6 p-5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2.5">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Patient Name</span>
                      <span className="text-slate-900 font-semibold">{submissionResult.patientName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Delivery Email</span>
                      <span className="text-slate-900 font-semibold font-mono">{submissionResult.deliveryEmail}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Age</span>
                      <span className="text-slate-900 font-semibold">{submissionResult.age} years</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Submitted At</span>
                      <span className="text-slate-900 font-semibold">{submissionResult.timestamp}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-500 font-medium block mb-1">Attached Files</span>
                      <div className="space-y-1">
                        {submissionResult.filesUploaded.map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-slate-700 bg-white px-2.5 py-1.5 rounded border border-slate-200"
                          >
                            <span className="truncate max-w-[240px] font-medium">{file.name}</span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleResetForm}
                      className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Submit Another Report</span>
                    </button>

                    <a
                      href={N8N_AGENT_URL}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Direct Agent Link</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </a>
                  </div>
                </div>
              ) : (
                /* The Submission Form */
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-slate-100 mb-6">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900">
                        Submit Medical Report
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        All fields are processed directly by the n8n agent workflow.
                      </p>
                    </div>

                    {/* Pre-fill with sample report button for effortless testing */}
                    <button
                      type="button"
                      onClick={handleLoadSampleReport}
                      className="self-start sm:self-auto text-xs font-medium text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Load sample metabolic & blood test data to test the agent immediately"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Use Sample Report</span>
                    </button>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <div className="flex-1">
                        <span className="font-semibold block mb-0.5">Submission Error</span>
                        <p>{error}</p>
                      </div>
                      <button
                        onClick={() => setError(null)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* field-0: Name */}
                    <div>
                      <label
                        htmlFor="field-0"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Patient Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="field-0"
                        name="field-0"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* field-1: Email */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="field-1"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Summary will be delivered here
                        </span>
                      </div>
                      <input
                        id="field-1"
                        name="field-1"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* field-2: Age */}
                    <div>
                      <label
                        htmlFor="field-2"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Age <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="field-2"
                        name="field-2"
                        type="number"
                        min="1"
                        max="130"
                        required
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 42"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* field-3: Upload your Medical Report */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Upload Medical Report <span className="text-rose-500">*</span>
                      </label>

                      {/* Dropzone */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                          isDragging
                            ? 'border-sky-500 bg-sky-50/50'
                            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleAddFiles(e.target.files);
                            }
                          }}
                        />

                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                          <Upload className="w-5 h-5" />
                        </div>

                        <p className="text-xs font-medium text-slate-800">
                          Click to upload or drag & drop documents
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Supported formats: PDF, TXT, DOCX, JPG, PNG (up to 25MB)
                        </p>
                      </div>

                      {/* File List */}
                      {files.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {files.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <FileText className="w-4 h-4 text-sky-700 shrink-0" />
                                <span className="font-medium text-slate-800 truncate">
                                  {item.name}
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">
                                  ({formatFileSize(item.size)})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile(index);
                                }}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                title="Remove file"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 px-4 text-sm font-semibold rounded-lg text-white transition-all flex items-center justify-center gap-2 shadow-sm ${
                          isSubmitting
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-sky-700 hover:bg-sky-800 active:scale-[0.99]'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing with AI Agent...</span>
                          </>
                        ) : (
                          <>
                            <span>Analyse Medical Report</span>
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 text-center leading-normal">
                      Submitting dispatches this payload directly to the authenticated n8n workflow.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Clinical Notice & FAQ Section */}
        <section id="clinical-notice" className="py-14 border-t border-slate-200 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Clinical Advisory & Disclaimer
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    The Medical Report Analyser is an automated comprehension tool powered by AI.
                    It summarizes laboratory reports, reference ranges, and diagnostic terminology
                    for personal reference and educational purposes only. It is not intended to provide
                    medical diagnoses, treatment plans, or emergency advice. Always consult a qualified,
                    licensed physician or medical provider regarding your diagnostic findings and clinical condition.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">
                    What types of reports are supported?
                  </span>
                  <p className="text-slate-500 leading-normal">
                    Complete Blood Count (CBC), Comprehensive Metabolic Panels (CMP), Lipid Profiles,
                    Urinalysis, Thyroid Panels (TSH/T3/T4), and general clinical pathology transcripts.
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-800 block mb-1">
                    How is my data protected?
                  </span>
                  <p className="text-slate-500 leading-normal">
                    Uploaded documents are streamed in-memory to the n8n agent workflow over secure SSL
                    and never written to public storage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Medical Report Analyser</span>
            <span aria-hidden="true">·</span>
            <span>AI Clinical Extraction Workflow</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={N8N_AGENT_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sky-700 hover:text-sky-800 font-medium inline-flex items-center gap-1"
            >
              <span>Hosted Agent</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span aria-hidden="true">·</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
