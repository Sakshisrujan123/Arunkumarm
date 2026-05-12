import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface Question {
  text: string;
  marks: number;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface Section {
  title: string;
  marksPerQuestion: number;
  questions: Question[];
}

export interface QuestionPaper {
  schoolName: string;
  grade: string;
  subject: string;
  board: string;
  totalMarks: number;
  timeAllowed: string;
  sections: Section[];
}

export async function generateQuestionPaper(config: {
  schoolName: string;
  grade: string;
  subject: string;
  board: string;
  language: string;
  totalMarks: number;
  timeAllowed: string;
  questionTypes: { id: string; label: string; count: number }[];
  topic?: string;
}): Promise<QuestionPaper> {
  const model = "gemini-3.1-pro-preview";
  
  const questionDistribution = config.questionTypes
    .filter(q => q.count > 0)
    .map(q => `${q.count} x ${q.label}`)
    .join(", ");

  const prompt = `Generate a professional school question paper with the following details:
- School: ${config.schoolName}
- Grade: ${config.grade}
- Subject: ${config.subject}
- Board: ${config.board}
- Language: ${config.language}
- Total Marks: ${config.totalMarks}
- Time: ${config.timeAllowed}
- Question Distribution: ${questionDistribution}
${config.topic ? `- Specific Topic/Concept/Chapter: ${config.topic}` : ""}

Strictly follow the mark distribution. Ensure the difficulty level matches the grade and board standards.
Include a complete solution key at the end.
Translate all content into ${config.language} if it is not English.

Return the data in a structured JSON format following this schema:
{
  "schoolName": string,
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
          "explanation": string
        }
      ]
    }
  ]
}
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          schoolName: { type: Type.STRING },
          grade: { type: Type.STRING },
          subject: { type: Type.STRING },
          board: { type: Type.STRING },
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
                      explanation: { type: Type.STRING }
                    },
                    required: ["text", "marks", "answer"]
                  }
                }
              },
              required: ["title", "marksPerQuestion", "questions"]
            }
          }
        },
        required: ["schoolName", "grade", "subject", "board", "totalMarks", "timeAllowed", "sections"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as QuestionPaper;
}
