import React, { useState, useRef, useEffect } from "react";
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
  FileDown,
  MessageSquare,
  Search,
  Check,
  Settings,
  Edit2,
  Trash2,
  Plus,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateQuestionPaper, suggestChapters, fetchQuestionBank, QuestionPaper as QPType, Question } from "./services/geminiService";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

const GRADES = [
  "SSLC / Class 10",
  "SSC / Class 10",
  "1st PUC",
  "2nd PUC",
  "Class 11",
  "Class 12",
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `B.A. ${i + 1}${i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} Semester`),
  ...Array.from({ length: 6 }, (_, i) => `B.Com. ${i + 1}${i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} Semester`),
  ...Array.from({ length: 6 }, (_, i) => `B.Sc. ${i + 1}${i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} Semester`),
  ...Array.from({ length: 8 }, (_, i) => `B.E / B.Tech ${i + 1}${i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} Semester`),
  ...Array.from({ length: 8 }, (_, i) => `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Semester (General/Other)`),
  "B.A. (Bachelor of Arts)",
  "B.Com (Bachelor of Commerce)",
  "B.Sc (Bachelor of Science)",
  "BBA (Bachelor of Business Administration)",
  "BCA (Bachelor of Computer Applications)",
  "B.Ed (Bachelor of Education)",
  "M.A. (Master of Arts)",
  "M.Com (Master of Commerce)",
  "M.Sc (Master of Science)",
  "M.E / M.Tech (Post Graduation)",
  "MBA (Master of Business Administration)",
  "MCA (Master of Computer Applications)",
  "M.Ed (Master of Education)",
  "M.Phil (Master of Philosophy)",
  "Ph.D / Doctorate"
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
  "Financial Management",
  "Strategic Management",
  "Managerial Economics",
  "Business Ethics",
  "Business Communication",
  "E-Commerce",
  "Supply Chain Management",
  "International Business",
  "Corporate Finance",
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
  "Research Methodology",
  "Educational Technology",
  "Counseling and Guidance",
  "Special Education",
  "Child Development and Pedagogy",
  "Advanced Calculus",
  "Topology",
  "Abstract Algebra",
  "Thermodynamics",
  "Solid State Physics",
  "Molecular Biology",
  "Genetics",
  "Biochemistry",
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
  "Punjabi",
  "General Knowledge (GK)",
  "Current Affairs",
  "Mental Ability",
  "Logical Reasoning",
  "Quantitative Aptitude",
  "General Awareness",
  "Indian History & Culture",
  "Geography of India",
  "Indian Constitution & Polity",
  "Indian Economy",
  "General Science",
  "Environmental Science",
  "Computer Literacy",
  "English Literature",
  "General Grammar",
  "High School Grammar",
  "Kannada Literature",
  "Hindi Literature",
  "Marathi Literature",
  "Tamil Literature",
  "Telugu Literature",
  "Malayalam Literature",
  "Gujarati Literature",
  "Bengali Literature",
  "Odia Literature",
  "Punjabi Literature",
  "Sanskrit Literature"
];
const BOARDS = [
  "CBSE", "ICSE", "IGCSE", "IB",
  "University of Delhi (DU)", "University of Mumbai (MU)", "Bangalore University", 
  "Gulbarga University (GU)", "University of Mysore (UoM)", "Central University of Karnataka (CUK)",
  "Karnataka State Akkamahadevi Women's University", "Kannada University (Hampi)",
  "Karnatak University Dharwad (KUD)", "Visvesvaraya Technological University (VTU)",
  "Mangalore University", "Savitribai Phule Pune University (SPPU)", "Anna University", 
  "University of Calcutta", "University of Madras", "Osmania University", 
  "Banaras Hindu University (BHU)", "Jawaharlal Nehru University (JNU)", 
  "Aligarh Muslim University (AMU)", "Jamia Millia Islamia", "University of Hyderabad", 
  "Pondicherry University", "Indira Gandhi National Open University (IGNOU)",
  "Indian Institute of Technology (IITs)", "Indian Institute of Management (IIMs)",
  "BITS Pilani", "Vellore Institute of Technology (VIT)", "SRM Institute of Science and Technology",
  "Amity University", "Manipal Academy of Higher Education", "Panjab University",
  "State Board (Karnataka)", "State Board (Maharashtra)", 
  "State Board (Tamil Nadu)", "State Board (Kerala)", "State Board (Andhra Pradesh)",
  "State Board (Telangana)", "State Board (Uttar Pradesh)", "State Board (Bihar)",
  "State Board (West Bengal)", "State Board (Gujarat)", "State Board (Rajasthan)",
  "Kendriya Vidyalaya (KVS)", "Jawahar Navodaya Vidyalayas (JNV)", "Sainik Schools",
  "Adarsh Schools", "Murarji Desai Residential Schools",
  "Other Indian University", "Other State Board"
];
const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", 
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Puducherry"
];
const LANGUAGES = ["English", "Hindi", "Kannada", "Marathi", "Telugu", "Tamil", "Malayalam", "Gujarati", "Bengali", "Odia", "Punjabi"];
const EXAM_NAMES = [
  "Annual Examination",
  "Mid Term Examination",
  "Preparatory Examination",
  "Unit Test",
  "Formative Assessment (FA)",
  "Summative Assessment (SA)",
  "Slip Test",
  "Monthly Test",
  "Railway Recruitment Board (RRB)",
  "Bank PO / Clerical Examination",
  "SSC CGL / CHSL / MTS",
  "UPSC CSAT / Civil Services",
  "State PSC (KPSC/MPSC/TNPSC etc)",
  "TET / CTET (Teachers Eligibility)",
  "Police Recruitment Exam",
  "PSI / PC Recruitment",
  "Village Administrative Officer (VAO)",
  "Panchayat Development Officer (PDO)",
  "FDA / SDA (Asst Recruitment)",
  "Village Accountant (VA) Exam",
  "KSRTC / KPTCL Recruitment",
  "NEET / JEE Practice",
  "Common Law Admission Test (CLAT)",
  "Navodaya Entrance Exam (JNVST)",
  "Sainik School Entrance Exam (AISSEE)",
  "Adarsh School Entrance Exam",
  "Murarji Desai Residential School Exam",
  "Kendriya Vidyalaya (KV) Examination",
  "Other Competitive Exam"
];
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
  { id: "Diagram", label: "Diagram Based" },
];

export default function App() {
  const [formData, setFormData] = useState({
    schoolName: "",
    grade: "Grade 10",
    examName: "Annual Examination",
    subjects: ["Science"],
    topic: "",
    board: "CBSE",
    state: "Karnataka",
    language: "English",
    totalMarks: 80,
    timeAllowed: "3 Hours",
    difficulty: "Medium",
    questionTypes: QUESTION_TYPES.map(t => {
      const isSelected = QUESTION_TYPES.slice(0, 6).some(st => st.id === t.id);
      return { 
        ...t, 
        count: !isSelected ? 0 : (t.id === "MCQ" ? 10 : (t.id === "VLA5" ? 2 : 5))
      };
    }),
    selectedQuestionTypeIds: QUESTION_TYPES.slice(0, 7).map(t => t.id), // Default first 7 (including Case Study)
    selectedChapters: [] as string[],
    maxChapters: 5,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState<QPType | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "preview" | "solutions">("form");
  const [unlockCode, setUnlockCode] = useState("");
  const [requestId, setRequestId] = useState("");
  const [suggestedChapters, setSuggestedChapters] = useState<string[]>([]);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [isFetchingChapters, setIsFetchingChapters] = useState(false);
  const [hasFetchedChapters, setHasFetchedChapters] = useState(false);
  
  // PDF Customization
  const [pdfHeader, setPdfHeader] = useState("");
  const [pdfFooter, setPdfFooter] = useState("PaperQuest AI - Generated Educational Content");
  const [pdfWatermark, setPdfWatermark] = useState("");

  const documentRef = useRef<HTMLDivElement>(null);

  const [isCopying, setIsCopying] = useState(false);

  // Editing State
  const [editingQuestion, setEditingQuestion] = useState<{
    sectionIdx: number;
    questionIdx: number;
    question: any;
  } | null>(null);

  // Question Bank State
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [isFetchingBank, setIsFetchingBank] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [bankError, setBankError] = useState("");

  // Security Measures: Prevent Copy/Paste/Scraping
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Only block on the document preview area or if the app is paid (to protect paid content)
      if (documentRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common scraping/save shortcuts (Ctrl+S, Ctrl+U, Ctrl+I, Ctrl+P)
      const forbiddenKeys = ['s', 'u', 'i', 'j'];
      if (e.ctrlKey || e.metaKey) {
        if (forbiddenKeys.includes(e.key.toLowerCase())) {
          e.preventDefault();
          alert("Security: Copying or printing this content via browser shortcuts is restricted.");
        }
      }
      
      if (e.key === 'F12') {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(requestId);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  const handleUnlock = () => {
    // The unlock code format is PQ-[REQUEST_ID]-ARUN
    if (unlockCode.toUpperCase().trim() === `PQ-${requestId}-ARUN`.toUpperCase()) {
      setIsPaid(true);
      setShowPayment(false);
      alert("Verification successful! Paper unlocked.");
    } else {
      alert("Invalid unlock code. Please contact the administrator.");
    }
  };

  const handleFetchChapters = async () => {
    if (formData.subjects.length === 0) return;
    setIsFetchingChapters(true);
    setChapterError(null);
    try {
      const chapters = await suggestChapters(formData.grade, formData.subjects, formData.board, formData.state);
      setSuggestedChapters(chapters);
      setHasFetchedChapters(true);
    } catch (err: any) {
      console.error("Failed to fetch chapters", err);
      let message = "Failed to fetch chapters. Please try again.";
      if (err?.message?.includes("429") || err?.message?.includes("quota")) {
        message = "Rate limit exceeded. Please wait a minute before trying again.";
      }
      setChapterError(message);
    } finally {
      setIsFetchingChapters(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.schoolName) {
      alert("Please enter school name");
      return;
    }
    setIsGenerating(true);
    try {
      const paper = await generateQuestionPaper({
        schoolName: formData.schoolName,
        grade: formData.grade,
        examName: formData.examName,
        subjects: formData.subjects,
        board: formData.board,
        state: formData.state,
        language: formData.language,
        totalMarks: formData.totalMarks,
        timeAllowed: formData.timeAllowed,
        difficulty: formData.difficulty,
        questionTypes: formData.questionTypes.filter(qt => formData.selectedQuestionTypeIds.includes(qt.id)),
        topic: formData.topic,
        chapters: formData.selectedChapters,
        maxChapters: formData.maxChapters
      });
      setGeneratedPaper(paper);
      setRequestId(Math.random().toString(36).substring(2, 8).toUpperCase());
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
    if (!ref.current) {
      alert("Reference element not found. Please try refreshing.");
      return;
    }
    
    setIsExporting(true);
    try {
      const element = ref.current;
      
      // Temporary style changes for better capture
      const originalStyle = element.style.cssText;
      element.style.width = "210mm"; // Force A4 width
      element.classList.remove('select-none');
      
      const canvas = await html2canvas(element, { 
        scale: 1.5, // Reduced from 2 to avoid memory limits on large documents
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: element.scrollWidth,
        // Remove scroll offsets which can be buggy
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // Fix for oklch colors not supported by html2canvas
          // We override common Tailwind classes with hex equivalents
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            .text-gray-700 { color: #374151 !important; }
            .text-gray-600 { color: #4b5563 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            .text-gray-400 { color: #9ca3af !important; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .bg-gray-100 { background-color: #f3f4f6 !important; }
            .border-gray-100 { border-color: #f3f4f6 !important; }
            .border-gray-200 { border-color: #e5e7eb !important; }
            .border-black { border-color: #000000 !important; }
            h1, h2, h3, h4, h5, h6, p, span, div { color: #000000; }
            .italic { font-style: italic; }
            .text-gray-700 { color: #374151 !important; }
          `;
          clonedDoc.head.appendChild(style);

          // Catch-all: Remove any remaining modern color functions (oklch, oklab, etc.) from style tags in the clone
          // html2canvas parser fails on these modern color formats
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            try {
              styleTags[i].innerHTML = styleTags[i].innerHTML
                .replace(/oklch\([^)]+\)/g, '#000000')
                .replace(/oklab\([^)]+\)/g, '#000000')
                .replace(/lab\([^)]+\)/g, '#000000')
                .replace(/lch\([^)]+\)/g, '#000000')
                .replace(/color\([^)]+\)/g, '#000000');
            } catch (e) {
              console.warn("Failed to sanitize style tag", e);
            }
          }

          // Also check for inline styles in the cloned document
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            if (el.style) {
              // We check if any style property contains a modern color function and reset it
              // This is a bit aggressive but necessary for html2canvas to finish
              for (let j = 0; j < el.style.length; j++) {
                const prop = el.style[j];
                const val = el.style.getPropertyValue(prop);
                if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('lab') || val.includes('lch') || val.includes('color('))) {
                  el.style.setProperty(prop, '#000000', 'important');
                }
              }
            }
          }

          // Ensure all images are loaded in clone
          const images = clonedDoc.getElementsByTagName('img');
          for (let i = 0; i < images.length; i++) {
            images[i].crossOrigin = "anonymous";
          }
        }
      });
      
      // Revert styles
      element.style.cssText = originalStyle;
      element.classList.add('select-none');
      
      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm top margin
      const bottomMargin = 50; // 50mm (5cm) bottom margin
      const contentWidth = pageWidth - (2 * margin);
      const imgHeightOnPdf = (canvas.height * contentWidth) / canvas.width;
      const contentHeight = pageHeight - margin - bottomMargin;
      
      let heightLeft = imgHeightOnPdf;
      let position = margin; // Start at top margin

      const drawPageDecorations = (pageNum: number, totalPages: number) => {
        // Header Text
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        if (pdfHeader) {
          pdf.text(pdfHeader, margin, 12);
        } else {
          pdf.text("Generated by PaperQuest AI", margin, 12);
        }
        
        // Footer / Page Number
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        const footerText = pdfFooter || "PaperQuest AI";
        // Place footer just above the 5cm bottom margin
        pdf.text(footerText, margin, pageHeight - bottomMargin + 8);
        pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - bottomMargin + 8, { align: "right" });
      };

      // Calculate total pages
      const totalPagesRequested = Math.max(1, Math.ceil(imgHeightOnPdf / contentHeight));

      // Add the first page
      drawPageDecorations(1, totalPagesRequested);
      pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeightOnPdf);
      heightLeft -= contentHeight;

      // Add subsequent pages
      let pageCount = 1;
      while (heightLeft > 0) {
        pageCount++;
        position = heightLeft - imgHeightOnPdf + margin;
        pdf.addPage();
        drawPageDecorations(pageCount, totalPagesRequested);
        pdf.addImage(imgData, "JPEG", margin, position, contentWidth, imgHeightOnPdf);
        heightLeft -= contentHeight;
      }

      pdf.save(filename);
    } catch (err) {
      console.error("PDF Export failed", err);
      alert("PDF generation failed. This can happen if the document is too long. Please try the Word format instead which handles multi-pages better.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToWord = async () => {
    if (!generatedPaper) return;

    const isSmallPaper = formData.totalMarks < 20;

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
              text: generatedPaper.examName,
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `Subject(s): ${generatedPaper.subject} | Grade: ${generatedPaper.grade}`, bold: true, size: isSmallPaper ? 20 : 24 }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `Time: ${generatedPaper.timeAllowed} | Max Marks: ${generatedPaper.totalMarks}`, bold: true, size: isSmallPaper ? 20 : 24 }),
              ],
            }),
            ...(generatedPaper?.sections || []).flatMap((section) => [
              new Paragraph({
                text: `${section.title} (${section.marksPerQuestion} Marks each)`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: isSmallPaper ? 200 : 400 },
              }),
              ...(section.questions || []).map((q, i) => new Paragraph({
                children: [
                  new TextRun({ text: `Q${i + 1}. ${q.text}`, size: isSmallPaper ? 18 : 22 }),
                  new TextRun({ text: ` [${q.marks}]`, bold: true, size: isSmallPaper ? 18 : 22 }),
                  ...(q.options ? q.options.map(opt => new TextRun({ text: `\n   ${opt}`, break: 1, size: isSmallPaper ? 16 : 20 })) : []),
                ],
                spacing: { after: isSmallPaper ? 100 : 200 },
              })),
            ]),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${generatedPaper.subject.replace(/, /g, "_")}_QP.docx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteQuestion = (sectionIdx: number, questionIdx: number) => {
    if (!generatedPaper) return;
    if (!confirm("Are you sure you want to delete this question?")) return;

    const newPaper = { ...generatedPaper };
    newPaper.sections[sectionIdx].questions.splice(questionIdx, 1);
    setGeneratedPaper(newPaper);
  };

  const handleEditQuestion = (sectionIdx: number, questionIdx: number, question: any) => {
    setEditingQuestion({ sectionIdx, questionIdx, question: { ...question } });
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion || !generatedPaper) return;

    const newPaper = { ...generatedPaper };
    newPaper.sections[editingQuestion.sectionIdx].questions[editingQuestion.questionIdx] = editingQuestion.question;
    setGeneratedPaper(newPaper);
    setEditingQuestion(null);
  };

  const handleAddQuestion = (sectionIdx: number) => {
    if (!generatedPaper) return;

    const newPaper = { ...generatedPaper };
    const section = newPaper.sections[sectionIdx];
    
    const newQuestion = {
      text: "New Question Text",
      marks: section.marksPerQuestion || 1,
      answer: "Sample Answer",
      explanation: "Sample Explanation"
    };

    section.questions.push(newQuestion);
    setGeneratedPaper(newPaper);
    
    // Immediately open edit modal for the new question
    setEditingQuestion({
      sectionIdx,
      questionIdx: section.questions.length - 1,
      question: newQuestion
    });
  };

  const handleFetchQuestionBank = async () => {
    if (formData.selectedChapters.length === 0) {
      alert("Please select at least one chapter to fetch a question bank.");
      return;
    }

    setIsFetchingBank(true);
    setBankError("");
    try {
      const bank = await fetchQuestionBank({
        grade: formData.grade,
        subjects: formData.subjects,
        board: formData.board,
        chapters: formData.selectedChapters,
        count: 15
      });
      setQuestionPool(bank);
      setShowBank(true);
    } catch (error) {
      console.error("Failed to fetch bank:", error);
      setBankError("Could not fetch question bank. Please try again.");
    } finally {
      setIsFetchingBank(false);
    }
  };

  const addFromBankToPaper = (question: Question) => {
    if (!generatedPaper) {
      alert("Please generate a paper first or use the Add section feature.");
      return;
    }

    // Default to the first section for simplicity, or we could ask
    const newPaper = { ...generatedPaper };
    if (newPaper.sections.length === 0) {
      newPaper.sections.push({
        title: "Section A",
        marksPerQuestion: question.marks || 1,
        questions: []
      });
    }

    const targetSectionIdx = 0; // Default to Section A
    newPaper.sections[targetSectionIdx].questions.push({ ...question });
    setGeneratedPaper(newPaper);
    alert(`Question added to Section ${String.fromCharCode(65 + targetSectionIdx)}`);
  };

  const removeFromBank = (idx: number) => {
    const newPool = [...questionPool];
    newPool.splice(idx, 1);
    setQuestionPool(newPool);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#1A1A1A]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-6 px-8 sticky top-0 z-10 shadow-sm no-print">
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
          <div className="flex flex-col md:flex-row items-center gap-4">
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
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print"
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

                  <section>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Examination Type</label>
                    <div className="relative">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select 
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all text-lg appearance-none"
                        value={formData.examName}
                        onChange={(e) => setFormData({...formData, examName: e.target.value})}
                      >
                        {EXAM_NAMES.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <section>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Grade / Course</label>
                      <select 
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black"
                        value={formData.grade}
                        onChange={(e) => setFormData({...formData, grade: e.target.value})}
                      >
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </section>
                    <section>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Board / University</label>
                      <select 
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black"
                        value={formData.board}
                        onChange={(e) => setFormData({...formData, board: e.target.value})}
                      >
                        {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </section>
                    <section>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">State</label>
                      <select 
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black"
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                      >
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </section>
                    <section className="md:col-span-3">
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
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Topic / Concept (Optional)</label>
                      <div className="relative">
                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input 
                          type="text" 
                          placeholder="e.g. Newton's Laws of Motion"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none"
                          value={formData.topic}
                          onChange={(e) => setFormData({...formData, topic: e.target.value})}
                        />
                      </div>
                    </section>
                    <section>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Target Chapter Count</label>
                      <div className="relative">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                        <input 
                          type="number" 
                          min="1"
                          max="20"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black outline-none"
                          value={formData.maxChapters}
                          onChange={(e) => setFormData({...formData, maxChapters: parseInt(e.target.value) || 1})}
                        />
                      </div>
                    </section>
                    <section className="md:col-span-3">
                       <div className="flex justify-between items-center mb-3">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Manual Chapter Selection (Optional)</label>
                         <button 
                          onClick={handleFetchChapters}
                          disabled={isFetchingChapters}
                          className="text-[10px] bg-gray-100 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
                         >
                           {isFetchingChapters ? "Fetching..." : <><Search className="w-3 h-3"/> Suggest Chapters</>}
                         </button>
                       </div>
                       
                       {chapterError && (
                         <div className="mb-3 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 animate-pulse">
                           {chapterError}
                         </div>
                       )}
                       
                       {suggestedChapters.length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 max-h-48 overflow-y-auto">
                            {suggestedChapters.map(chapter => (
                              <label key={chapter} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer transition-all">
                                <input 
                                  type="checkbox"
                                  checked={formData.selectedChapters.includes(chapter)}
                                  onChange={(e) => {
                                    let newChapters = [...formData.selectedChapters];
                                    if (e.target.checked) newChapters.push(chapter);
                                    else newChapters = newChapters.filter(c => c !== chapter);
                                    setFormData({...formData, selectedChapters: newChapters});
                                  }}
                                  className="rounded border-gray-300 text-black focus:ring-black"
                                />
                                <span className="text-[10px] font-medium truncate" title={chapter}>{chapter}</span>
                              </label>
                            ))}
                         </div>
                       ) : (
                         <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200 text-center">
                           <p className="text-xs text-gray-400">Click "Suggest Chapters" to pick from a list based on your subject.</p>
                         </div>
                       )}
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
                    <section>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Difficulty Level</label>
                      <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1.5 rounded-2xl">
                        {["Easy", "Medium", "Hard"].map(level => (
                          <button
                            key={level}
                            onClick={() => setFormData({...formData, difficulty: level})}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                              formData.difficulty === level 
                                ? "bg-black text-white shadow-lg" 
                                : "text-gray-500 hover:bg-white hover:text-black"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>

                  <section>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Select Question Formats to Include</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      {QUESTION_TYPES.map(type => (
                        <label key={type.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-all cursor-pointer group">
                          <input 
                            type="checkbox"
                            checked={formData.selectedQuestionTypeIds.includes(type.id)}
                            onChange={(e) => {
                              let newSelected = [...formData.selectedQuestionTypeIds];
                              if (e.target.checked) newSelected.push(type.id);
                              else newSelected = newSelected.filter(id => id !== type.id);
                              setFormData({...formData, selectedQuestionTypeIds: newSelected});
                            }}
                            className="rounded border-gray-300 text-black focus:ring-black"
                          />
                          <span className={`text-[10px] font-medium ${formData.selectedQuestionTypeIds.includes(type.id) ? "text-black" : "text-gray-400"}`}>{type.label.split(' (')[0]}</span>
                        </label>
                      ))}
                    </div>
                  </section>

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
                            const newTypes = formData.questionTypes.map(t => ({ 
                              ...t, 
                              count: formData.selectedQuestionTypeIds.includes(t.id) ? val : 0 
                            }));
                            setFormData({...formData, questionTypes: newTypes});
                          }}
                          className="bg-black text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-all"
                        >
                          Quick Set Selected
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formData.questionTypes
                        .filter(type => formData.selectedQuestionTypeIds.includes(type.id))
                        .map((type) => (
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
                                const newTypes = formData.questionTypes.map(t => 
                                  t.id === type.id ? { ...t, count: parseInt(e.target.value) || 0 } : t
                                );
                                setFormData({...formData, questionTypes: newTypes});
                              }}
                            />
                          </div>
                      ))}
                      {formData.selectedQuestionTypeIds.length === 0 && (
                        <div className="sm:col-span-2 p-8 border border-dashed border-gray-200 rounded-2xl text-center">
                          <p className="text-xs text-gray-400">Select at least one question format above to configure quantities.</p>
                        </div>
                      )}
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
                      <span className="text-gray-500">Exam Type</span>
                      <span className="font-bold">{formData.examName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Grade</span>
                      <span className="font-bold">{formData.grade}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Difficulty</span>
                      <span className={`font-bold ${
                        formData.difficulty === "Easy" ? "text-emerald-600" : 
                        formData.difficulty === "Medium" ? "text-amber-600" : "text-rose-600"
                      }`}>{formData.difficulty}</span>
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
                      <span className="text-gray-500">Service</span>
                      <span className="font-bold text-emerald-600">Premium Generation</span>
                    </div>
                  </div>
                  
                  {formData.selectedChapters.length > 0 && (
                    <button 
                      onClick={handleFetchQuestionBank}
                      disabled={isFetchingBank}
                      className="w-full mb-3 bg-emerald-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                    >
                      {isFetchingBank ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                          Opening Question Bank...
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-5 h-5" />
                          View Question Bank
                        </>
                      )}
                    </button>
                  )}

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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-indigo-100 p-4 rounded-full mb-4 text-indigo-600">
                        <Printer className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Verification Required</h2>
                      <p className="text-gray-500 text-sm mb-6">Enter the activation code provided by the administrator to unlock your paper.</p>
                      
                      <div className="bg-gray-50 rounded-2xl p-6 w-full mb-6 text-left border border-gray-100 italic">
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-4 leading-relaxed">Your question paper has been successfully architected and is now securely locked. To receive your activation code, please click the button below to notify the administrator.</p>
                          
                          <a 
                            href={`https://wa.me/919986373413?text=${encodeURIComponent(`Hi, I just generated a new Question Paper for *${formData.schoolName}* (${formData.subjects.join(", ")}, ${formData.grade}). \n\nSystem ID: *${requestId}* \n\nPlease send me the download activation code.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-emerald-500 text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-md active:scale-95 no-underline"
                          >
                            <MessageSquare className="w-5 h-5" />
                            Request Download Code
                          </a>
                          <p className="text-[10px] text-gray-400 mt-4 text-center leading-relaxed">Our administrator (9986373413) will verify the request and resend the activation code to you.</p>
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Activation Code</label>
                          <input 
                            type="text"
                            placeholder="Enter Code (e.g. PQ-XXXXXX-ARUN)"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-black outline-none transition-all placeholder:font-normal placeholder:text-gray-300 uppercase"
                            value={unlockCode}
                            onChange={(e) => setUnlockCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                          />
                        </div>
                      </div>

                      <div className="space-y-3 w-full">
                        <button 
                          onClick={handleUnlock}
                          className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          Unlock Document
                        </button>
                        <button 
                          onClick={() => {
                            setGeneratedPaper(null); 
                            setShowPayment(false); 
                            setActiveTab("form");
                            setUnlockCode("");
                          }}
                          className="w-full bg-transparent text-gray-400 py-3 rounded-2xl text-sm font-medium hover:text-red-500 transition-all font-mono"
                        >
                          CANCEL & RESET
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Action Bar */}
              {generatedPaper && isPaid && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-4 no-print">
                  <div className="flex items-center gap-3 ml-2">
                    <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                    <span className="text-sm font-bold">Paper Ready for Download</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <button 
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all no-print"
                        onClick={() => {
                          const el = document.getElementById('pdf-settings-popover');
                          if (el) el.classList.toggle('hidden');
                        }}
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        PDF Tools
                      </button>
                      
                      <div id="pdf-settings-popover" className="hidden absolute bottom-full pb-4 right-0 min-w-[280px] z-[100]">
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <Settings className="w-4 h-4 text-black" />
                            <h4 className="font-bold text-sm">PDF Decorations</h4>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Header Text</label>
                              <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-black outline-none"
                                placeholder="School/Org Name"
                                value={pdfHeader}
                                onChange={(e) => setPdfHeader(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Footer Text</label>
                              <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-black outline-none"
                                placeholder="Contact/Website"
                                value={pdfFooter}
                                onChange={(e) => setPdfFooter(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Watermark</label>
                              <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-1 focus:ring-black outline-none font-bold text-blue-600"
                                placeholder="e.g. DRAFT, CONFIDENTIAL"
                                value={pdfWatermark}
                                onChange={(e) => setPdfWatermark(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => document.getElementById('pdf-settings-popover')?.classList.add('hidden')}
                            className="w-full mt-4 py-2 bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-all"
                          >
                            Apply Settings
                          </button>
                        </div>
                      </div>
                    </div>

                     <button 
                      onClick={() => !isExporting && exportToPDF(documentRef, `${formData.subjects.join("_")}_Generated.pdf`)}
                      disabled={isExporting}
                      className={`px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${isExporting ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50'}`}
                    >
                      <FileDown className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                      {isExporting ? 'Generating PDF...' : 'PDF Format'}
                    </button>
                    <button 
                      onClick={exportToWord}
                      className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Word Format
                    </button>
                    <button 
                      onClick={handlePrint}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      Print Paper
                    </button>
                  </div>
                </div>
              )}

              {/* Document Preview */}
              <div className="overflow-x-auto pb-8 print-document-wrapper">
                <div className={`bg-white shadow-2xl rounded-sm border border-gray-200 overflow-hidden mx-auto transition-all relative print-area ${formData.totalMarks < 20 ? "min-h-[297mm]" : "min-h-[1000px]"}`} 
                     style={{ width: "210mm", padding: formData.totalMarks < 20 ? "10mm" : "15mm" }}>
                  
                  {/* Watermark Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-wrap gap-20 items-center justify-center opacity-[0.03] select-none rotate-[-45deg] overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <span key={i} className="text-4xl font-bold uppercase tracking-widest whitespace-nowrap">PaperQuest Protected</span>
                    ))}
                  </div>

                  <div ref={documentRef} className={`document-container relative z-10 select-none ${formData.totalMarks < 20 ? "text-tight" : ""}`}>
                  {/* Common Header */}
                  <div className={`text-center border-b-2 border-black pb-4 ${formData.totalMarks < 20 ? "mb-4" : "mb-6"}`}>
                    <h1 className={`${formData.totalMarks < 20 ? "text-xl" : "text-2xl"} font-bold uppercase tracking-tight mb-1`}>{generatedPaper?.schoolName}</h1>
                    <h2 className={`${formData.totalMarks < 20 ? "text-lg" : "text-xl"} font-bold uppercase tracking-wide italic mb-2 text-gray-700`}>{generatedPaper?.examName}</h2>
                    <div className="flex justify-between text-[10px] font-bold mt-4 uppercase">
                      <span>Subject(s): {generatedPaper?.subject}</span>
                      <span>{generatedPaper?.grade}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold mt-1 uppercase">
                      <span>{generatedPaper?.board} {generatedPaper?.state ? `| ${generatedPaper?.state}` : ""}</span>
                      <span>Time: {generatedPaper?.timeAllowed}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold mt-1 uppercase">
                      <span>{isPaid ? `Ref ID: ${requestId}` : "Doc ID Locked"}</span>
                      <span>Marks: {generatedPaper?.totalMarks}</span>
                    </div>
                  </div>

                  {activeTab === "preview" ? (
                    <div className={`paper-content ${formData.totalMarks < 20 ? "space-y-3" : "space-y-6"}`}>
                      {generatedPaper?.sections?.map((section, sIdx) => (
                        <div key={sIdx} className="section">
                          <div className="flex items-center justify-between border-y border-gray-300 mb-4 tracking-widest no-print bg-gray-50/50 px-4">
                            <h2 className={`${formData.totalMarks < 20 ? "text-[10px] py-0.5" : "text-sm py-1"} font-bold uppercase text-center flex-1`}>
                              Section {String.fromCharCode(65 + sIdx)}: {section.title} ({section.marksPerQuestion} Marks Each)
                            </h2>
                            <button 
                              onClick={() => handleAddQuestion(sIdx)}
                              className="p-1 hover:bg-emerald-100 text-emerald-600 rounded transition-colors group relative"
                              title="Add Question to this Section"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20">Add Question</span>
                            </button>
                          </div>
                          
                          {/* This is the print-only header (static) */}
                          <h2 className={`${formData.totalMarks < 20 ? "text-[10px] py-0.5" : "text-sm py-1"} border-y border-gray-300 font-bold uppercase ${formData.totalMarks < 20 ? "mb-2" : "mb-4"} tracking-widest text-center only-print`}>
                            Section {String.fromCharCode(65 + sIdx)}: {section.title} ({section.marksPerQuestion} Marks Each)
                          </h2>
                          
                          <div className={formData.totalMarks < 20 ? "space-y-2" : "space-y-4"}>
                            {section.questions?.map((q, qIdx) => (
                              <div key={qIdx} className="group/question relative flex gap-3">
                                <span className={`font-bold shrink-0 min-w-[20px] ${formData.totalMarks < 20 ? "text-xs" : ""}`}>Q{qIdx + 1}.</span>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className={`${formData.totalMarks < 20 ? "text-xs mb-1" : "text-sm mb-2"}`}>{q.text}</p>
                                    
                                    {/* Question Specific Actions - Only visible on hover in preview */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover/question:opacity-100 transition-opacity no-print">
                                      <button 
                                        onClick={() => handleEditQuestion(sIdx, qIdx, q)}
                                        className="p-1 hover:bg-gray-100 text-gray-500 hover:text-black rounded transition-colors"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteQuestion(sIdx, qIdx)}
                                        className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  {q.diagramDescription && (
                                    <div className="my-4 border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl p-8 text-center">
                                      <div className="flex flex-col items-center gap-2">
                                        <Layers className="w-8 h-8 text-gray-300" />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">[ DIAGRAM REQUIRED ]</p>
                                        <p className="text-[11px] text-gray-600 italic leading-relaxed max-w-md mx-auto">
                                          {q.diagramDescription}
                                        </p>
                                        <p className="text-[9px] text-gray-400 mt-2">(Refer to NCERT Textbook for the standard diagram of this topic)</p>
                                      </div>
                                    </div>
                                  )}
                                  {q.options && (
                                    <div className={`grid grid-cols-2 gap-x-2 gap-y-1 ${formData.totalMarks < 20 ? "mt-1" : "mt-2"}`}>
                                      {q.options.map((opt, i) => (
                                        <div key={i} className={`${formData.totalMarks < 20 ? "text-[9px]" : "text-xs"}`}>
                                          ({String.fromCharCode(97 + i)}) {opt}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className={`${formData.totalMarks < 20 ? "text-[9px]" : "text-xs"} font-bold font-mono`}>[{q.marks}]</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`solution-content ${formData.totalMarks < 20 ? "space-y-4" : "space-y-8"}`}>
                       <h2 className={`${formData.totalMarks < 20 ? "text-lg mb-4" : "text-xl mb-8"} font-bold text-center underline`}>Solution Key & Marking Scheme</h2>
                       {generatedPaper?.sections?.map((section, sIdx) => (
                        <div key={sIdx} className="section">
                           <h3 className={`${formData.totalMarks < 20 ? "text-[10px] mb-2" : "text-sm mb-4"} font-bold uppercase`}>Section {String.fromCharCode(65 + sIdx)}</h3>
                           <div className={formData.totalMarks < 20 ? "space-y-3" : "space-y-6"}>
                            {section.questions?.map((q, qIdx) => (
                              <div key={qIdx} className="border-l-2 border-gray-100 pl-4">
                                <p className={`${formData.totalMarks < 20 ? "text-xs" : "text-sm"} font-bold`}>Ans {qIdx + 1}.</p>
                                <p className={`${formData.totalMarks < 20 ? "text-xs mt-0.5" : "text-sm mt-1"} text-emerald-800 font-medium`}>{q.answer}</p>
                                {q.explanation && (
                                  <p className={`${formData.totalMarks < 20 ? "text-[9px] mt-1" : "text-xs mt-2"} text-gray-500 italic`}>Rationale: {q.explanation}</p>
                                )}
                              </div>
                            ))}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className={`${formData.totalMarks < 20 ? "mt-6" : "mt-12"} pt-4 border-t border-gray-200 text-center`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md no-print">
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

      {/* Question Bank Modal */}
      {showBank && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">Question Bank</h3>
                  <p className="text-xs text-emerald-600 font-medium">Curated for your selected chapters</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBank(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6 bg-white">
              {bankError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
                  {bankError}
                </div>
              )}
              
              {questionPool.length === 0 && !bankError ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm">No questions in the bank yet. Fetching might have failed or the bank is empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {questionPool.map((q, qIdx) => (
                    <div key={qIdx} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-emerald-200 transition-all group relative">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <span className="px-2 py-1 bg-white border border-gray-100 rounded text-[10px] font-bold text-gray-400 uppercase">
                          {q.marks} Marks
                        </span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => addFromBankToPaper(q)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all group/btn flex items-center gap-1 shadow-sm"
                            title="Add to Paper"
                          >
                            <Plus className="w-3 h-3" />
                            <span className="text-[10px] font-bold pr-1">Add</span>
                          </button>
                          <button 
                            onClick={() => removeFromBank(qIdx)}
                            className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100 rounded-lg transition-all"
                            title="Remove from Bank"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-medium leading-relaxed mb-4">{q.text}</p>
                      {q.diagramDescription && (
                        <div className="mt-2 text-[10px] text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg italic">
                          <Layers className="w-3 h-3 inline mr-1" />
                          Recommended Diagram: {q.diagramDescription}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-b-3xl">
              <p className="text-[10px] text-gray-400 max-w-sm">
                These questions are generated based on your selected chapters. Use them to quickly populate your question paper.
              </p>
              <button 
                onClick={() => setShowBank(false)}
                className="px-8 py-2.5 bg-black text-white rounded-2xl text-sm font-bold shadow-lg shadow-black/10 hover:bg-gray-800 transition-all active:scale-95"
              >
                Close Bank
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Edit Question</h3>
                <p className="text-xs text-gray-400 font-mono">Q{editingQuestion.questionIdx + 1} | Section {String.fromCharCode(65 + editingQuestion.sectionIdx)}</p>
              </div>
              <button 
                onClick={() => setEditingQuestion(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Question Text</label>
                <textarea 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all resize-none h-32"
                  value={editingQuestion.question.text}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: { ...editingQuestion.question, text: e.target.value }
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Marks</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all"
                    value={editingQuestion.question.marks}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, marks: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Diagram Description (Optional)</label>
                   <input 
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all"
                    value={editingQuestion.question.diagramDescription || ""}
                    placeholder="NCERT Diagram reference..."
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, diagramDescription: e.target.value }
                    })}
                  />
                </div>
              </div>

              {editingQuestion.question.options && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Multiple Choice Options</label>
                  <div className="grid grid-cols-2 gap-3">
                    {editingQuestion.question.options.map((opt: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-300 w-4">{String.fromCharCode(97 + i)})</span>
                        <input 
                          type="text"
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none text-xs"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...editingQuestion.question.options];
                            newOptions[i] = e.target.value;
                            setEditingQuestion({
                              ...editingQuestion,
                              question: { ...editingQuestion.question, options: newOptions }
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-2">Correct Answer</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none h-20 text-sm"
                    value={editingQuestion.question.answer}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, answer: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Explanation / Rationale</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all resize-none h-20 text-sm"
                    value={editingQuestion.question.explanation || ""}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, explanation: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-3xl">
              <button 
                onClick={() => setEditingQuestion(null)}
                className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-black transition-all"
              >
                Discard Changes
              </button>
              <button 
                onClick={handleSaveQuestion}
                className="px-8 py-2.5 bg-black text-white rounded-2xl text-sm font-bold shadow-lg shadow-black/10 hover:bg-gray-800 transition-all active:scale-95"
              >
                Save Question
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
