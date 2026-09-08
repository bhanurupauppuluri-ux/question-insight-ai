import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, AlertTriangle, ClipboardCheck, Clock, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BloomChart, DifficultyChart, TopicCoverageChart, BLOOM_LEVELS } from "@/components/AnalyticsCharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/exam/$examId")({
  head: () => ({
    meta: [
      { title: "Paper analysis | Smart Exam Question Analyzer" },
      {
        name: "description",
        content:
          "Cognitive level distribution, difficulty mix, timing and syllabus coverage for an analysed exam paper.",
      },
      { property: "og:title", content: "Paper analysis | Smart Exam Question Analyzer" },
      {
        property: "og:description",
        content: "Question-by-question Bloom's taxonomy, difficulty and coverage breakdown.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExamPage,
});

function ExamPage() {
  const { examId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["exam", examId],
    enabled: Boolean(user),
    queryFn: async () => {
      const [examSet, questions, topics] = await Promise.all([
        supabase.from("exam_sets").select("*").eq("id", examId).maybeSingle(),
        supabase.from("questions").select("*").eq("exam_set_id", examId).order("position"),
        supabase.from("syllabus_topics").select("*").eq("exam_set_id", examId).order("name"),
      ]);
      if (examSet.error) throw examSet.error;
      return {
        examSet: examSet.data,
        questions: questions.data ?? [],
        topics: topics.data ?? [],
      };
    },
  });

  if (isLoading || !data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-64 w-full" />
      </main>
    );
  }

  if (!data.examSet) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-3xl">Paper not found</h1>
        <Link to="/" className="mt-4 inline-block text-sm underline underline-offset-4">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const { examSet, questions, topics } = data;

  const bloomData = BLOOM_LEVELS.map((level) => ({
    name: level,
    value: questions.filter((q) => q.bloom_level === level).length,
  }));
  const difficultyData = ["Easy", "Medium", "Hard"].map((level) => ({
    name: level,
    value: questions.filter((q) => q.difficulty === level).length,
  }));
  const topicData = topics.map((t) => ({ name: t.name, value: t.question_count }));
  const totalMinutes = questions.reduce((sum, q) => sum + Number(q.expected_minutes ?? 0), 0);
  const flagged = questions.filter((q) => q.bias_flag || Number(q.ambiguity_score ?? 0) >= 0.5);
  const gaps = topics.filter((t) => t.question_count === 0);
  const rubricScored = questions.filter((q) => q.rubric_score !== null);
  const avgRubric = rubricScored.length
    ? Math.round(
        rubricScored.reduce((sum, q) => sum + Number(q.rubric_score ?? 0), 0) / rubricScored.length,
      )
    : null;

  return (
    <main className="page-gradient min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All papers
        </Link>

        <header className="mt-4">
          <h1 className="text-4xl">{examSet.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {examSet.subject ? `${examSet.subject} · ` : ""}
            {questions.length} questions · {examSet.summary}
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={<Target className="size-4" />} label="Syllabus coverage" value={`${Math.round(Number(examSet.coverage_percent ?? 0))}%`} />
          <StatCard icon={<Clock className="size-4" />} label="Expected time" value={`${Math.round(totalMinutes)} min`} />
          <StatCard icon={<AlertTriangle className="size-4" />} label="Flagged questions" value={String(flagged.length)} />
          <StatCard
            icon={<ClipboardCheck className="size-4" />}
            label="Rubric alignment"
            value={avgRubric === null ? "—" : `${avgRubric}%`}
          />
          <StatCard icon={<Target className="size-4" />} label="Uncovered topics" value={String(gaps.length)} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="panel p-6">
            <h2 className="text-xl">Cognitive levels</h2>
            <p className="mb-2 text-xs text-muted-foreground">Bloom's taxonomy distribution</p>
            <BloomChart data={bloomData} />
          </div>
          <div className="panel p-6">
            <h2 className="text-xl">Difficulty mix</h2>
            <p className="mb-2 text-xs text-muted-foreground">Estimated per question</p>
            <DifficultyChart data={difficultyData} />
          </div>
        </section>

        {topicData.length > 0 && (
          <section className="panel mt-6 p-6">
            <h2 className="text-xl">Syllabus coverage</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Questions per topic — red bars are gaps with no questions
            </p>
            <TopicCoverageChart data={topicData} />
          </section>
        )}

        <section className="panel mt-6 overflow-hidden">
          <div className="border-b border-border p-6">
            <h2 className="text-xl">Question breakdown</h2>
          </div>
          <ul className="divide-y divide-border">
            {questions.map((q) => (
              <li key={q.id} className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {q.number_label ?? `Q${q.position}`}
                  </span>
                  <Badge variant="secondary">{q.bloom_level}</Badge>
                  <Badge variant="outline">{q.difficulty}</Badge>
                  {q.expected_minutes ? (
                    <Badge variant="outline">{Math.round(Number(q.expected_minutes))} min</Badge>
                  ) : null}
                  {q.marks ? <Badge variant="outline">{Number(q.marks)} marks</Badge> : null}
                  {q.bias_flag && <Badge variant="destructive">Possible bias</Badge>}
                  {Number(q.ambiguity_score ?? 0) >= 0.5 && <Badge variant="destructive">Ambiguous</Badge>}
                  {q.rubric_score !== null && (
                    <Badge variant={Number(q.rubric_score) >= 70 ? "secondary" : "destructive"}>
                      Rubric {Math.round(Number(q.rubric_score))}%
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed">{q.text}</p>
                {q.topic && (
                  <p className="mt-2 text-xs text-muted-foreground">Topic: {q.topic}</p>
                )}
                {q.quality_notes && (
                  <p className="mt-1 text-xs text-muted-foreground italic">{q.quality_notes}</p>
                )}
                {(q.rubric_criterion || q.rubric_notes) && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-xs font-medium">
                      Rubric criterion: {q.rubric_criterion ?? "Unmatched"}
                    </p>
                    {q.rubric_notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{q.rubric_notes}</p>
                    )}
                    {q.rubric_score !== null && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${Math.min(100, Math.max(0, Number(q.rubric_score)))}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}
