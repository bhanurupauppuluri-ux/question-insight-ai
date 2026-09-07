import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BLOOM = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"] as const;
const DIFFICULTY = ["Easy", "Medium", "Hard"] as const;

const AnalyzeInput = z.object({
  title: z.string().min(1).max(160),
  subject: z.string().max(120).optional().nullable(),
  syllabusText: z.string().max(20000).optional().nullable(),
  text: z.string().max(60000).optional().nullable(),
  file: z
    .object({
      name: z.string(),
      mime: z.string(),
      dataUrl: z.string(),
    })
    .optional()
    .nullable(),
});

const AnalysisSchema = z.object({
  summary: z.string().default(""),
  coverage_percent: z.number().min(0).max(100).default(0),
  questions: z
    .array(
      z.object({
        number_label: z.string().nullish(),
        text: z.string(),
        marks: z.number().nullish(),
        bloom_level: z.enum(BLOOM).catch("Understand"),
        difficulty: z.enum(DIFFICULTY).catch("Medium"),
        expected_minutes: z.number().nullish(),
        ambiguity_score: z.number().min(0).max(1).nullish(),
        bias_flag: z.boolean().default(false),
        quality_notes: z.string().nullish(),
        topic: z.string().nullish(),
      }),
    )
    .default([]),
  topics: z
    .array(
      z.object({
        name: z.string(),
        question_count: z.number().default(0),
        covered: z.boolean().default(false),
      }),
    )
    .default([]),
});

const SYSTEM_PROMPT = `You are an assessment-design expert who audits exam papers.
Extract EVERY question from the provided material (keep sub-questions separate) and analyse each one.

For each question return:
- number_label: the printed question number if visible (e.g. "Q3(b)")
- text: the full question text, cleaned up
- marks: marks/points if stated, else null
- bloom_level: one of Remember, Understand, Apply, Analyze, Evaluate, Create
- difficulty: Easy, Medium or Hard
- expected_minutes: realistic solving time in minutes
- ambiguity_score: 0 (perfectly clear) to 1 (highly ambiguous)
- bias_flag: true when wording shows cultural, gender, regional or socio-economic bias
- quality_notes: one short sentence on clarity, bias or improvement
- topic: the syllabus topic it maps to (use the supplied syllabus wording when given)

Also return topics: every syllabus topic supplied (or inferred when no syllabus is given) with the
number of questions covering it and covered=true when question_count > 0.
coverage_percent = percentage of syllabus topics with at least one question.
summary: 2-3 sentences on balance, rigour and coverage gaps.

Respond with ONLY a JSON object: {"summary","coverage_percent","questions":[],"topics":[]}`;

function extractJson(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? raw) as string;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The AI response could not be read.");
  return JSON.parse(body.slice(start, end + 1));
}

export const analyzeExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => AnalyzeInput.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const content: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: [
          `Exam title: ${data.title}`,
          data.subject ? `Subject: ${data.subject}` : "",
          data.syllabusText
            ? `Syllabus outline:\n${data.syllabusText}`
            : "No syllabus supplied - infer the topics from the questions.",
          data.text ? `Exam questions:\n${data.text}` : "The exam paper is attached as a file.",
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ];

    if (data.file) {
      if (data.file.mime.startsWith("image/")) {
        content.push({ type: "image_url", image_url: { url: data.file.dataUrl } });
      } else {
        content.push({
          type: "file",
          file: { filename: data.file.name, file_data: data.file.dataUrl },
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) throw new Error("Too many requests right now - try again shortly.");
      if (response.status === 402)
        throw new Error("AI credits are exhausted. Add credits in Lovable to keep analysing papers.");
      throw new Error(`Analysis failed (${response.status}): ${body.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const analysis = AnalysisSchema.parse(extractJson(raw));

    const supabase = context.supabase;
    const userId = context.userId;

    const { data: examSet, error: examError } = await supabase
      .from("exam_sets")
      .insert({
        user_id: userId,
        title: data.title,
        subject: data.subject ?? null,
        source_type: data.file ? (data.file.mime.startsWith("image/") ? "image" : "pdf") : "paste",
        raw_text: data.text ?? null,
        syllabus_text: data.syllabusText ?? null,
        status: "analyzed",
        coverage_percent: analysis.coverage_percent,
        summary: analysis.summary,
      })
      .select("id")
      .single();

    if (examError || !examSet) throw new Error(examError?.message ?? "Could not save the exam set.");

    if (analysis.questions.length) {
      const { error } = await supabase.from("questions").insert(
        analysis.questions.map((q, index) => ({
          exam_set_id: examSet.id,
          user_id: userId,
          position: index + 1,
          number_label: q.number_label ?? null,
          text: q.text,
          marks: q.marks ?? null,
          bloom_level: q.bloom_level,
          difficulty: q.difficulty,
          expected_minutes: q.expected_minutes ?? null,
          ambiguity_score: q.ambiguity_score ?? null,
          bias_flag: q.bias_flag,
          quality_notes: q.quality_notes ?? null,
          topic: q.topic ?? null,
        })),
      );
      if (error) throw new Error(error.message);
    }

    if (analysis.topics.length) {
      const { error } = await supabase.from("syllabus_topics").insert(
        analysis.topics.map((t) => ({
          exam_set_id: examSet.id,
          user_id: userId,
          name: t.name,
          question_count: t.question_count,
          covered: t.covered || t.question_count > 0,
        })),
      );
      if (error) throw new Error(error.message);
    }

    return { examSetId: examSet.id as string, questionCount: analysis.questions.length };
  });
