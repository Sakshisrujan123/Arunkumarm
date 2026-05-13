import React, { useState, useRef } from "react";
import { 
  BookOpen, 
  Download, 
  FileText, 
  GraduationCap, 
  Layers, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  School,
  Languages,
  Printer,
  FileDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateQuestionPaper, QuestionPaper as QPType } from "./services/geminiService";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

const GRADES = [
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
  "B.A. (Bachelor of Arts)",
  "B.Com (Bachelor of Commerce)",
  "B.Sc (Bachelor of Science)",
  "M.A. (Master of Arts)",
  "M.Sc (Master of Science)",
  "B.Ed (Bachelor of Education)",
  "M.Ed (Master of Education)",
  "BBA (Bachelor of Business Administration)",
  "MBA (Master of Business Administration)"
];
const SUBJECTS = [
  "Science", 
  "Maths", 
  "MAT (Mental Ability Test)",
  "SAT (Scholastic Aptitude Test)",
  "Social Science", 
  "English", 
  "Physics", 
  "Chemistry", 
  "Biology", 
  "Zoology", 
  "Botany", 
  "Economics", 
  "History", 
  "Geography", 
  "Political Science", 
  "Business Studies", 
  "Accountancy", 
  "Psychology", 
  "Sociology", 
  "Statistics",
  "Information Technology (IT)",
  "Marketing Management",
  "Human Resource Management",
  "Operations Management",
  "Organizational Behavior",
  "Business Law",
  "Entrepreneurship",
  "Computer Science", 
  "General Knowledge",
  "Financial Accounting",
  "Cost Accounting",
  "Principles of Management",
  "Educational Psychology",
  "Pedagogy of Science",
  "Curriculum and Instruction",
  "Statistical Mechanics",
  "Quantum Physics",
  "Organic Chemistry",
  "Digital Marketing",
  "Microeconomics",
  "Macroeconomics",
  "Hindi", 
  "Sanskrit", 
  "Kannada", 
  "Marathi", 
  "Telugu", 
  "Tamil", 
  "Malayalam", 
  "Gujarati", 
  "Bengali", 
  "Odia", 
  "Punjabi"
];
const BOARDS = [
  "CBSE", 
  "ICSE", 
  "State Board (Karnataka)", 
  "State Board (Maharashtra)", 
  "State Board (Delhi)", 
  "Other State Boards",
  "NTSE",
  "NMMS",
  "Navodaya Entrance",
  "Sainik School Entrance",
  "NEET",
  "JEE Prelims",
  "JEE Advanced",
  "KCET",
  "KTET"
];
const LANGUAGES = ["English", "Hindi", "Kannada", "Marathi", "Telugu", "Tamil", "Malayalam", "Gujarati", "Bengali", "Odia", "Punjabi"];
const QUESTION_TYPES = [
  { id: "MCQ", label: "MCQ (Multiple Choice Questions)" },
  { id: "VSA", label: "VSA (1 Mark)" },
  { id: "SA2", label: "SA (2 Marks)" },
  { id: "SA3", label: "SA (3 Marks)" },
  { id: "LA4", label: "LA (4 Marks)" },
  { id: "VLA5", label: "VLA (5 Marks)" },
  { id: "CaseStudy", label: "Case Study" },
  { id: "A&R", label: "Assertion & Reasoning" },
  { id: "FB", label: "Fill in the Blanks" },
  { id: "MTF", label: "Match the Following" },
];

export default function App() {
  const [formData, setFormData] = useState({
    schoolName: "",
    grade: "Grade 10",
    subjects: ["Science"],
    topic: "",
    board: "CBSE",
    language: "English",
    totalMarks: 80,
    timeAllowed: "3 Hours",
    questionTypes: QUESTION_TYPES.map(t => ({ ...t, count: t.id === "MCQ" ? 10 : (t.id === "VLA5" ? 2 : 5) })),
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState<QPType | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "preview" | "solutions">("form");
  const [isPaying, setIsPaying] = useState(false);
  const [config, setConfig] = useState<{ razorpayKeyId: string | null; isConfigured: boolean } | null>(null);

  React.useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error("Config fetch failed", err));
  }, []);

  const paperRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);

  const paymentAmount = formData.totalMarks < 50 ? 50 : 100;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsPaying(true);
    const res = await loadRazorpayScript();

    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      setIsPaying(false);
      return;
    }

    // Create Order on Server
    try {
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: paymentAmount }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to create payment order");
      }

      const options = {
        key: config?.razorpayKeyId || "rzp_test_placeholder",
        currency: data.currency,
        amount: data.amount.toString(),
        order_id: data.id,
        name: "PaperQuest AI",
        description: `QP for ${formData.subjects.join(", ")} - ${formData.grade}`,
        image: "/favicon.ico",
        handler: async function (response: any) {
          // This runs on successful payment modal completion
          // Now we must verify it on the server
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            }).then((t) => t.json());

            if (verifyRes.success) {
              setIsPaid(true);
              setShowPayment(false);
              setIsPaying(false);
              alert("Payment Verified! Your paper is now ready for download.");
            } else {
              alert("Payment verification failed: " + verifyRes.message);
              setIsPaying(false);
            }
          } catch (err) {
            console.error("Verification Error:", err);
            alert("Error verifying payment.");
            setIsPaying(false);
          }
        },
        prefill: {
          name: "Educator",
          email: "educator@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#000000",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on("payment.failed", function (response: any) {
        alert("Payment Failed: " + response.error.reason);
        setIsPaying(false);
      });
      paymentObject.open();
    } catch (error) {
      console.error("Payment setup failed:", error);
      alert("Payment gateway communication error.");
      setIsPaying(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.schoolName) {
      alert("Please enter school name");
      return;
    }
    setIsGenerating(true);
    try {
      const paper = await generateQuestionPaper(formData);
      setGeneratedPaper(paper);
      setShowPayment(true);
      setActiveTab("preview");
    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate paper. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToPDF = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  };

  const exportToWord = async () => {
    if (!generatedPaper) return;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: generatedPaper.schoolName,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `Subject(s): ${generatedPaper.subject} | Grade: ${generatedPaper.grade}`, bold: true }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `Time: ${generatedPaper.timeAllowed} | Max Marks: ${generatedPaper.totalMarks}`, bold: true }),
              ],
            }),
            ...generatedPaper.sections.flatMap((section) => [
              new Paragraph({
                text: `${section.title} (${section.marksPerQuestion} Marks each)`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400 },
              }),
              ...section.questions.map((q, i) => new Paragraph({
                children: [
                  new TextRun({ text: `Q${i + 1}. ${q.text}` }),
                  new TextRun({ text: ` [${q.marks}]`, bold: true }),
                  ...(q.options ? q.options.map(opt => new TextRun({ text: `\n   ${opt}`, break: 1 })) : []),
                ],
                spacing: { after: 200 },
              })),
            ]),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${generatedPaper.subject.replace(/, /g, "_")}_QP.docx`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#1A1A1A]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-6 px-8 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2 rounded-lg">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">PaperQuest AI</h1>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Professional QP Generator</p>
            </div>
          </div>
          <div className="flex gap-4">
            {generatedPaper && (
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab("form")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "form" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"}`}
                >
                  Configure
                </button>
                <button 
                  onClick={() => setActiveTab("preview")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "preview" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"}`}
                >
                  Question Paper
                </button>
                <button 
                  onClick={() => setActiveTab("solutions")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "solutions" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-black"}`}
                >
                  Solutions
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <AnimatePresence mode="wait">
          {activeTab === "form" ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column - Configurations */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                  <Layers className="w-6 h-6" />
                  Blueprint Configuration
                </h2>
                
                <div className="space-y-8">
                  <section>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">School Identification</label>
                    <div className="relative">
                      <School className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input 
                        type="text" 
                        placeholder="Enter School Name"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all text-lg"
                        value={formData.schoolName}
                        onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                      />
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Grade & Level</label>
                      <select 
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black"
                        value={formData.grade}
                        onChange={(e) => setFormData({...formData, grade: e.target.value})}
                      >
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </section>
                    <section>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Board</label>
                      <select 
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black"
                        value={formData.board}
                        onChange={(e) => setFormData({...formData, board: e.target.value})}
                      >
                        {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </section>
                    <section className="md:col-span-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Subjects (Select Multiple for Mixed Paper)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-gray-50 p-4 rounded-2xl max-h-60 overflow-y-auto border border-gray-100">
                        {SUBJECTS.map(s => (
                          <label key={s} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer transition-all group">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-black focus:ring-black"
                              checked={formData.subjects.includes(s)}
                              onChange={(e) => {
                                let newSubjects = [...formData.subjects];
                                if (e.target.checked) {
                                  newSubjects.push(s);
                                } else {
                                  newSubjects = newSubjects.filter(sub => sub !== s);
                                }
                                if (newSubjects.length === 0) newSubjects = [s]; // Keep at least one
                                setFormData({...formData, subjects: newSubjects});
                              }}
                            />
                            <span className={`text-[11px] font-medium transition-colors ${formData.subjects.includes(s) ? "text-black font-bold" : "text-gray-500"}`}>{s}</span>
                          </label>
                        ))}
                      </div>
                    </section>
                    <section>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Medium of Instruction</label>
                      <div className="relative">
                        <Languages className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <select 
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black appearance-none"
                          value={formData.language}
                          onChange={(e) => setFormData({...formData, language: e.target.value})}
                        >
                          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </section>
                    <section>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Topic / Concept / Chapter (Optional)</label>
                      <div className="relative">
                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                          type="text" 
                          placeholder="e.g. Newton's Laws of Motion"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black"
                          value={formData.topic}
                          onChange={(e) => setFormData({...formData, topic: e.target.value})}
                        />
                      </div>
                    </section>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Total Marks</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black"
                        value={isNaN(formData.totalMarks) ? "" : formData.totalMarks}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setFormData({...formData, totalMarks: isNaN(val) ? 0 : val});
                        }}
                      />
                    </section>
                    <section>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Time Duration</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                          type="text" 
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black"
                          value={formData.timeAllowed}
                          onChange={(e) => setFormData({...formData, timeAllowed: e.target.value})}
                        />
                      </div>
                    </section>
                  </div>

                  <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Question Distribution (Quantities)</label>
                      <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl">
                        <input 
                          type="number" 
                          placeholder="Qty"
                          className="w-12 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-center"
                          id="bulkQty"
                          min="0"
                          max="200"
                        />
                        <button 
                          onClick={() => {
                            const val = parseInt((document.getElementById('bulkQty') as HTMLInputElement).value) || 0;
                            const newTypes = formData.questionTypes.map(t => ({ ...t, count: val }));
                            setFormData({...formData, questionTypes: newTypes});
                          }}
                          className="bg-black text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-all"
                        >
                          Quick Set All
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formData.questionTypes.map((type, idx) => (
                        <div key={type.id} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                          <div className="flex-1">
                            <span className="text-sm font-bold block mb-1">{type.label}</span>
                            <span className="text-[10px] text-gray-400 uppercase">Input Quantity Below</span>
                          </div>
                          <input 
                            type="number" 
                            min="0"
                            max="200"
                            className="w-16 px-2 py-2 bg-white border border-gray-200 rounded-xl text-center font-bold focus:ring-2 focus:ring-black"
                            value={type.count}
                            onChange={(e) => {
                              const newTypes = [...formData.questionTypes];
                              newTypes[idx].count = parseInt(e.target.value) || 0;
                              setFormData({...formData, questionTypes: newTypes});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              {/* Right Column - Summary & Action */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-6">Execution Summary</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subjects</span>
                      <span className="font-bold text-right">{formData.subjects.join(", ")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Grade</span>
                      <span className="font-bold">{formData.grade}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Language</span>
                      <span className="font-bold">{formData.language}</span>
                    </div>
                    {formData.topic && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Topic</span>
                        <span className="font-bold truncate max-w-[150px]">{formData.topic}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-4 border-t border-gray-100">
                      <span className="text-gray-500">Service Fee</span>
                      <span className="font-bold text-emerald-600">₹{paymentAmount}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                        Generating Blueprint...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Generate Question Paper
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
                  <div className="flex gap-3">
                    <CheckCircle2 className="text-emerald-600 w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Standardized Formatting</p>
                      <p className="text-xs text-emerald-700 mt-1">Our AI ensures all papers strictly follow educational board guidelines with correct mark distributions.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Payment Overlay */}
              {showPayment && !isPaid && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-emerald-100 p-4 rounded-full mb-6 text-emerald-600">
                        <CreditCard className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Secure Generation Fee</h2>
                      {!config?.isConfigured && (
                        <div className="w-full bg-red-50 p-4 rounded-2xl mb-4 border border-red-100 flex items-start gap-3">
                          <AlertCircle className="text-red-500 w-5 h-5 shrink-0" />
                          <div className="text-left">
                            <p className="text-xs font-bold text-red-800">Gateway Not Configured</p>
                            <p className="text-[10px] text-red-600">Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the Secrets panel to enable payments.</p>
                          </div>
                        </div>
                      )}
                      {config?.razorpayKeyId?.startsWith("rzp_test") && (
                        <div className="w-full bg-amber-50 p-4 rounded-2xl mb-4 border border-amber-100 flex items-start gap-3 text-left">
                          <AlertCircle className="text-amber-600 w-5 h-5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-amber-800">Test Mode Active</p>
                            <p className="text-[10px] text-amber-600">Use test card 4111 1111 1111 1111 with any expiry and CVV to test.</p>
                          </div>
                        </div>
                      )}
                      <p className="text-gray-500 mb-8">Pay the nominal fee to unlock and download your professionally generated paper with solutions.</p>
                      
                      <div className="bg-gray-50 rounded-2xl p-6 w-full mb-8">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-500 uppercase tracking-widest font-bold">Total Amount</span>
                          <span className="text-3xl font-black text-black">₹{paymentAmount}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 text-left">Includes generation for {formData.subjects.join(", ")}, {formData.grade} for {formData.schoolName}.</p>
                      </div>

                      <div className="space-y-3 w-full">
                        <button 
                          onClick={handlePayment}
                          disabled={isPaying}
                          className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:bg-gray-400"
                        >
                          {isPaying ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                          ) : (
                            <CreditCard className="w-5 h-5" />
                          )}
                          {isPaying ? "Opening Gateway..." : `Pay ₹${paymentAmount} via UPI / Card`}
                        </button>
                        <button 
                          onClick={() => {
                            setGeneratedPaper(null); 
                            setShowPayment(false); 
                            setActiveTab("form");
                          }}
                          className="w-full bg-transparent text-gray-400 py-3 rounded-2xl text-sm font-medium hover:text-red-500 transition-all font-mono"
                        >
                          CANCEL GENERATION
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Action Bar */}
              {generatedPaper && isPaid && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-3 ml-2">
                    <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                    <span className="text-sm font-bold">Paper Ready for Download</span>
                  </div>
                  <div className="flex gap-3">
                     <button 
                      onClick={() => exportToPDF(activeTab === "preview" ? paperRef : solutionRef, `${formData.subjects.join("_")}_Generated.pdf`)}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all"
                    >
                      <FileDown className="w-4 h-4" />
                      PDF Format
                    </button>
                    <button 
                      onClick={exportToWord}
                      className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Word Format
                    </button>
                  </div>
                </div>
              )}

              {/* Document Preview */}
              <div className="overflow-x-auto pb-8">
                <div className="bg-white shadow-2xl rounded-sm border border-gray-200 overflow-hidden min-h-[1000px] mx-auto transition-all" 
                     style={{ width: "210mm", padding: "15mm" }}>
                  
                  <div ref={activeTab === "preview" ? paperRef : solutionRef} className="document-container">
                  {/* Common Header */}
                  <div className="text-center border-b-2 border-black pb-4 mb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-tight mb-1">{generatedPaper?.schoolName}</h1>
                    <div className="flex justify-between text-sm font-bold mt-4 uppercase">
                      <span>Subject(s): {generatedPaper?.subject}</span>
                      <span>Grade: {generatedPaper?.grade}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold mt-1 uppercase">
                      <span>Time: {generatedPaper?.timeAllowed}</span>
                      <span>Marks: {generatedPaper?.totalMarks}</span>
                    </div>
                  </div>

                  {activeTab === "preview" ? (
                    <div className="paper-content space-y-6">
                      {generatedPaper?.sections.map((section, sIdx) => (
                        <div key={sIdx} className="section">
                          <h2 className="text-sm border-y border-gray-300 py-1 font-bold uppercase mb-4 tracking-widest text-center">
                            Section {String.fromCharCode(65 + sIdx)}: {section.title} ({section.marksPerQuestion} Marks Each)
                          </h2>
                          <div className="space-y-4">
                            {section.questions.map((q, qIdx) => (
                              <div key={qIdx} className="flex gap-3">
                                <span className="font-bold shrink-0 min-w-[20px]">Q{qIdx + 1}.</span>
                                <div className="flex-1">
                                  <p className="text-sm mb-2">{q.text}</p>
                                  {q.options && (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                      {q.options.map((opt, i) => (
                                        <div key={i} className="text-xs">
                                          ({String.fromCharCode(97 + i)}) {opt}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs font-bold font-mono">[{q.marks}]</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="solution-content space-y-8">
                       <h2 className="text-xl font-bold text-center underline mb-8">Solution Key & Marking Scheme</h2>
                       {generatedPaper?.sections.map((section, sIdx) => (
                        <div key={sIdx} className="section">
                           <h3 className="text-sm font-bold uppercase mb-4">Section {String.fromCharCode(65 + sIdx)}</h3>
                           <div className="space-y-6">
                            {section.questions.map((q, qIdx) => (
                              <div key={qIdx} className="border-l-2 border-gray-100 pl-4">
                                <p className="text-sm font-bold">Ans {qIdx + 1}.</p>
                                <p className="text-sm mt-1 text-emerald-800 font-medium">{q.answer}</p>
                                {q.explanation && (
                                  <p className="text-xs mt-2 text-gray-500 italic">Rationale: {q.explanation}</p>
                                )}
                              </div>
                            ))}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className="mt-12 pt-4 border-t border-gray-200 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">End of Examination Paper</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Generating Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 mb-6">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-black"
               />
               <GraduationCap className="absolute inset-0 m-auto text-black w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Architecting Your Paper</h2>
            <p className="text-gray-500 text-sm animate-pulse">Consulting AI Education Specialists...</p>
          </div>
        </div>
      )}
    </div>
  );
}
