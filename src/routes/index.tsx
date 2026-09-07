import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, BrainCircuit, ScanText, ShieldQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadPanel } from "@/components/UploadPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Exam Question Analyzer" },
      {
        name: "description",
        content:
          "Upload or paste exam papers and get Bloom's taxonomy tagging, difficulty scoring, bias checks and syllabus coverage analytics.",
      },
      { property: "og:title", content: "Smart Exam Question Analyzer" },
      {
        property: "og:description",
        content:
          "AI analysis of exam papers: cognitive levels, difficulty, question quality and syllabus coverage gaps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: examSets, isLoading } = useQuery({
    queryKey: ["exam-sets"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_sets")
        .select("id, title, subject, coverage_percent, created_at, source_type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-24">
        <Skeleton className="h-12 w-72" />
      </main>
    );
  }

  if (!user) return <Landing />;

  return (
    <main className="page-gradient min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Exam Analyzer
            </p>
            <h1 className="mt-1 text-4xl">Your question papers</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{user.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </header>

        <div className="mt-8">
          <UploadPanel onDone={() => queryClient.invalidateQueries({ queryKey: ["exam-sets"] })} />
        </div>

        <section className="mt-10">
          <h2 className="text-2xl">Recent analyses</h2>
          {isLoading ? (
            <Skeleton className="mt-4 h-24 w-full" />
          ) : examSets && examSets.length > 0 ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {examSets.map((set) => (
                <li key={set.id}>
                  <Link
                    to="/exam/$examId"
                    params={{ examId: set.id }}
                    className="panel block p-5 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{set.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {set.subject ?? "No subject"} ·{" "}
                          {new Date(set.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {Math.round(Number(set.coverage_percent ?? 0))}% covered
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing analysed yet — add your first paper above.
            </p>
          )}
        </section>
      </div>
    </main>
  );

  function Landing() {
    return (
      <main className="page-gradient min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
            For educators & students
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-tight sm:text-6xl">
            Know exactly what your exam paper is really testing.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Upload a PDF, snap a photo of a printed or handwritten paper, or paste the questions. Every
            question is tagged by cognitive level, scored for difficulty, clarity and bias, and mapped
            against your syllabus.
          </p>
          <div className="mt-8 flex gap-3">
            <Button size="lg" onClick={() => navigate({ to: "/auth" })}>
              Start analysing
            </Button>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Feature icon={<ScanText className="size-5" />} title="Any format" body="PDF, scans, photos of handwritten papers, or plain pasted text." />
            <Feature icon={<BrainCircuit className="size-5" />} title="Bloom's taxonomy" body="Remember through Create — see the real cognitive balance." />
            <Feature icon={<ShieldQuestion className="size-5" />} title="Quality checks" body="Ambiguity, bias, marks and realistic solving time per question." />
            <Feature icon={<BookOpenCheck className="size-5" />} title="Coverage gaps" body="Match questions to your syllabus and find untested topics." />
          </div>
        </div>
      </main>
    );
  }
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="panel p-5">
      <div className="text-accent-foreground">{icon}</div>
      <h2 className="mt-3 text-lg">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
