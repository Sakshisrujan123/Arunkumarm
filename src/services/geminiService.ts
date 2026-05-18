import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: any = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = (process.env.GEMINI_API_KEY) || "";
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export interface Question {
  text: string;
  marks: number;
  options?: string[];
  answer: string;
  explanation?: string;
  diagramDescription?: string;
}

export interface Section {
  title: string;
  marksPerQuestion: number;
  questions: Question[];
}

export interface QuestionPaper {
  schoolName: string;
  grade: string;
  examName: string;
  subject: string;
  board: string;
  state?: string;
  totalMarks: number;
  timeAllowed: string;
  sections: Section[];
}

export async function suggestChapters(grade: string, subjects: string[], board: string, state?: string): Promise<string[]> {
  const model = "gemini-3-flash-preview";
  const subjectsStr = subjects.join(", ");
  const prompt = `List the major chapters for the following subjects: ${subjectsStr} in ${grade} following the ${board} curriculum${state ? ` in the state of ${state}` : ""}. 
  Provide a comprehensive list of chapters across all these subjects.
  Return ONLY a JSON array of strings containing the chapter names. Each string should be just the chapter title.`;

  const response = await getAI().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  const text = response.text || "";
  try {
    // Basic cleaning in case of markdown wrapping or extra whitespace
    const cleanedText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const result = JSON.parse(cleanedText);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("JSON parsing failed for suggested chapters:", error, "Raw text:", text);
    return [];
  }
}

export async function fetchQuestionBank(config: {
  grade: string;
  subjects: string[];
  board: string;
  chapters: string[];
  count?: number;
}): Promise<Question[]> {
  const model = "gemini-3-flash-preview";
  const subjectsStr = config.subjects.join(", ");
  const chaptersStr = config.chapters.join(", ");
  const count = config.count || 20;

  const prompt = `Generate a bank of ${count} diverse questions for the following details:
- Grade: ${config.grade}
- Subjects: ${subjectsStr}
- Board: ${config.board}
- Chapters: ${chaptersStr}

Include various question types (MCQ, Short Answer, Long Answer, Diagram-based).
For diagram-based questions, include a "diagramDescription" field.

Return ONLY a JSON array of question objects following this schema:
{
  "text": string,
  "marks": number,
  "options": string[] (only for MCQ),
  "answer": string,
  "explanation": string,
  "diagramDescription": string (optional)
}`;

  const response = await getAI().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            marks: { type: Type.NUMBER },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            diagramDescription: { type: Type.STRING }
          },
          required: ["text", "marks", "answer"]
        }
      }
    }
  });

  const text = response.text || "[]";
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse question bank", e);
    return [];
  }
}

export async function generateQuestionPaper(config: {
  schoolName: string;
  grade: string;
  examName: string;
  subjects: string[];
  board: string;
  state: string;
  language: string;
  totalMarks: number;
  timeAllowed: string;
  questionTypes: { id: string; label: string; count: number }[];
  difficulty: string;
  topic?: string;
  chapters?: string[];
  maxChapters?: number;
}): Promise<QuestionPaper> {
  const model = "gemini-3-flash-preview";
  
  const subjectsString = config.subjects.join(", ");
  const questionDistribution = config.questionTypes
    .filter(q => q.count > 0)
    .map(q => `${q.count} x ${q.label}`)
    .join(", ");

  const prompt = `Generate a professional school/university question paper with the following details:
- Institution: ${config.schoolName}
- Exam Name: ${config.examName}
- Grade/Course: ${config.grade}
- Subjects: ${subjectsString}
- Board/University: ${config.board}
- State: ${config.state}
- Language: ${config.language}
- Total Marks: ${config.totalMarks}
- Time: ${config.timeAllowed}
- Difficulty Level: ${config.difficulty}
- Question Distribution: ${questionDistribution}
${config.topic ? `- Specific Topic/Concept/Chapter: ${config.topic}` : ""}
${config.chapters && config.chapters.length > 0 ? `- IMPORTANT: Distribute questions EQUALLY and COMPREHENSIVELY across these specific chapters: ${config.chapters.join(", ")}` : (config.maxChapters ? `- IMPORTANT: Randomly select and cover exactly ${config.maxChapters} major chapters from the syllabus, ensuring a wide and fair coverage.` : "- IMPORTANT: Ensure a balanced coverage of the entire syllabus for the specified subjects.")}

DIAGRAM INSTRUCTIONS:
- For "Diagram Based" questions: Focus on concepts like Human Digestive System, Heart, Circuits, Geometry figures, etc., specifically from NCERT textbooks.
- Provide a detailed "diagramDescription" field explaining exactly what the diagram should contain (e.g., "A neat diagram of the Nephron with parts Glomerulus, Bowman's capsule, and Henle's loop labeled A, B, and C").
- Do NOT include actual images, only a rigorous technical description that matches the NCERT visual style.

DISTRIBUTION RULES:
1. If multiple subjects/chapters are provided, ensure every single one is represented in the paper.
2. The total sum of marks across all questions MUST exactly equal ${config.totalMarks}.
3. The questions should be distributed across the syllabus such that no single chapter or subject dominates the entire paper unless it is the only one provided.
4. For ${config.difficulty} difficulty: Ensure the cognitive load and complexity of questions are strictly aligned with ${config.difficulty} standards for Grade ${config.grade}.
5. ONLY generate the question types specified in the "Question Distribution". DO NOT include "Case Study" or "Assertion & Reasoning" questions unless they are explicitly listed in the requested distribution.

CRITICAL:
- Ensure the questions are fresh, unique, and varied.
- Include a complete solution key at the end.
- Translate all content into ${config.language}.
- The output MUST be valid JSON.

Return the data in a structured JSON format following this schema:
{
  "schoolName": string,
  "examName": string,
  "grade": string,
  "subject": string,
  "board": string,
  "totalMarks": number,
  "timeAllowed": string,
  "sections": [
    {
      "title": string,
      "marksPerQuestion": number,
      "questions": [
        {
          "text": string,
          "marks": number,
          "options": string[] (only for MCQ),
          "answer": string,
          "explanation": string,
          "diagramDescription": string (ONLY for diagram-based questions, describe the NCERT diagram required)
        }
      ]
    }
  ]
}
`;

  const response = await getAI().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          schoolName: { type: Type.STRING },
          examName: { type: Type.STRING },
          grade: { type: Type.STRING },
          subject: { type: Type.STRING },
          board: { type: Type.STRING },
          state: { type: Type.STRING },
          totalMarks: { type: Type.NUMBER },
          timeAllowed: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                marksPerQuestion: { type: Type.NUMBER },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      marks: { type: Type.NUMBER },
                      options: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING } 
                      },
                      answer: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      diagramDescription: { type: Type.STRING }
                    },
                    required: ["text", "marks", "answer"]
                  }
                }
              },
              required: ["title", "marksPerQuestion", "questions"]
            }
          }
        },
        required: ["schoolName", "examName", "grade", "subject", "board", "totalMarks", "timeAllowed", "sections"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as QuestionPaper;
}
