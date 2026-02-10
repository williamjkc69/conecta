import OpenAI from "openai";
import { AI_ROLES } from "@/constants/common";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface TranscriptEntry {
  role: typeof AI_ROLES.AGENT | typeof AI_ROLES.USER;
  content: string;
}

interface SkillEvaluation {
  skill_name: string;
  knowledge_level:
    | "No knowledge"
    | "Basic"
    | "Intermediate"
    | "Advanced"
    | "Expert";
  score: number; // 1-10
  evidence: string;
  red_flags: string[];
}

interface CustomQuestionEvaluation {
  question: string;
  answer_summary: string;
  quality: "Poor" | "Fair" | "Good" | "Excellent";
  red_flags: string[];
}

interface InterviewAnalysis {
  technical_skills_evaluation: SkillEvaluation[];
  custom_questions_evaluation?: CustomQuestionEvaluation[];
  overall_assessment: {
    technical_competency_score: number;
    communication_quality: string;
    language_proficiency?: string;
    strengths: string[];
    weaknesses: string[];
    behavioral_observations: string[];
  };
  recommendation: {
    decision: "Advance" | "Reject" | "Needs Review";
    confidence: "Low" | "Medium" | "High";
    reasoning: string;
    suggested_next_steps: string;
  };
}

export async function analyzeInterviewTranscript(
  transcript: string | TranscriptEntry[],
  jobTitle: string,
  requiredSkills: string,
  language: string,
  customQuestions?: string
): Promise<InterviewAnalysis> {
  try {
    // Convert transcript to string if it's an array
    const transcriptText = Array.isArray(transcript)
      ? transcript
          .map(
            (entry) =>
              `${entry.role === AI_ROLES.AGENT ? "Interviewer" : "Candidate"}: ${entry.content}`
          )
          .join("\n")
      : transcript;

    const skillsArray = requiredSkills.split(",").map((s) => s.trim());
    const questionsArray = customQuestions
      ? customQuestions
          .split(",")
          .map((q) => q.trim())
          .filter((q) => q.length > 0)
      : [];

    // Determine output language (default to Spanish)
    const outputLanguage =
      language && language.toLowerCase().startsWith("en")
        ? "English"
        : "Spanish";

    const systemPrompt = `You are an expert technical recruiter analyzing interview transcripts. Your job is to evaluate the candidate's technical skills, communication ability, and overall fit for the position.

Position: ${jobTitle}
Required Skills: ${requiredSkills}
Interview Language: ${language}
${questionsArray.length > 0 ? `Custom Questions: ${customQuestions}` : ""}

Analyze the transcript and provide a detailed, objective evaluation in JSON format.
IMPORTANT: You MUST write your COMPLETE analysis (reasoning, summary, feedback, strengths, weaknesses etc.) in ${outputLanguage}.`;

    const userPrompt = `Analyze this technical interview transcript and provide a comprehensive evaluation:

TRANSCRIPT:
${transcriptText}

REQUIRED SKILLS TO EVALUATE:
${skillsArray.map((skill, i) => `${i + 1}. ${skill}`).join("\n")}

${questionsArray.length > 0 ? `\nCUSTOM QUESTIONS ASKED:\n${questionsArray.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n` : ""}

Provide your analysis in the following JSON structure:
{
  ${
    questionsArray.length > 0
      ? `"custom_questions_evaluation": [
    {
      "question": "the question text",
      "answer_summary": "brief summary of candidate's answer",
      "quality": "Poor" | "Fair" | "Good" | "Excellent",
    }
  ],`
      : ""
  }
  "overall_assessment": {
    "technical_competency_score": average of all skill scores,
    "communication_quality": "assessment of how well they communicated (clear, struggled, excellent, etc.)",
    "language_proficiency": "if language is English, provide CEFR level (A1-C2), otherwise omit",
    "strengths": ["list of candidate's strong points"],
    "weaknesses": ["list of areas needing improvement"],
    "behavioral_observations": ["any notable behaviors: nervous, confident, evasive, etc."]
  },
  "recommendation": {
    "decision": "Advance" | "Reject" | "Needs Review",
    "confidence": "Low" | "Medium" | "High",
    "reasoning": "detailed explanation of your decision based on the evidence",
    "suggested_next_steps": "what should happen next (e.g., technical deep-dive, reject politely, etc.)"
  }
}

SCORING GUIDELINES:
- 1-2: No knowledge (said "I don't know" or couldn't answer)
- 3-4: Basic (only theoretical knowledge, no practical examples)
- 5-6: Intermediate (gave examples but lacked technical depth)
- 7-8: Advanced (detailed examples with technical depth)
- 9-10: Expert (demonstrated mastery, best practices, complex scenarios)

DECISION GUIDELINES:
- Advance: Average score ≥ 6, no critical skill gaps, good communication
- Reject: Average score < 5, multiple "No knowledge" in required skills, poor communication
- Needs Review: Score 5-6, mixed results, or unusual circumstances

Be objective and base your evaluation solely on evidence from the transcript.`;

    console.log("[OpenAI] Analyzing interview transcript...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: AI_ROLES.SYSTEM as any, content: systemPrompt },
        { role: AI_ROLES.USER as any, content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3 // Lower temperature for more consistent analysis
    });

    const analysisText = completion.choices[0].message.content;

    if (!analysisText) {
      throw new Error("No analysis returned from OpenAI");
    }

    const analysis: InterviewAnalysis = JSON.parse(analysisText);

    console.log("[OpenAI] Analysis complete");
    console.log("[OpenAI] Decision:", analysis.recommendation.decision);
    console.log(
      "[OpenAI] Average score:",
      analysis.overall_assessment.technical_competency_score
    );

    console.log(222, analysis);
    return analysis;
  } catch (error: any) {
    console.error("[OpenAI] Error analyzing transcript:", error);

    // Return a fallback analysis if OpenAI fails
    return {
      technical_skills_evaluation: requiredSkills.split(",").map((skill) => ({
        skill_name: skill.trim(),
        knowledge_level: "No knowledge",
        score: 0,
        evidence: "Analysis failed - manual review required",
        red_flags: ["Automated analysis unavailable"]
      })),
      overall_assessment: {
        technical_competency_score: 0,
        communication_quality: "Unable to assess - analysis failed",
        strengths: [],
        weaknesses: ["Automated analysis failed"],
        behavioral_observations: ["Manual review required"]
      },
      recommendation: {
        decision: "Needs Review",
        confidence: "Low",
        reasoning: `Automated analysis failed: ${error.message}. Manual review of transcript required.`,
        suggested_next_steps:
          "Manually review the interview transcript and recording"
      }
    };
  }
}
