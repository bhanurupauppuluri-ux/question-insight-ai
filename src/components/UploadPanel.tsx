import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { FileText, Image as ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyzeExam } from "@/lib/analysis.functions";

type PickedFile = { name: string; mime: string; dataUrl: string; size: number };

const ACCEPTED = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

function readFile(file: File): Promise<PickedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () =>
      resolve({
        name: file.name,
        mime: file.type,
        dataUrl: String(reader.result),
        size: file.size,
      });
    reader.readAsDataURL(file);
  });
}

export function UploadPanel({ onDone }: { onDone: () => void }) {
  const analyze = useServerFn(analyzeExam);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  async function pick(files: FileList | null) {
    const picked = files?.[0];
    if (!picked) return;
    if (!ACCEPTED.includes(picked.type)) {
      toast.error("Please choose a PDF, PNG, JPG or WEBP file.");
      return;
    }
    if (picked.size > 15 * 1024 * 1024) {
      toast.error("Files must be under 15 MB.");
      return;
    }
    setFile(await readFile(picked));
  }

  async function submit() {
    if (!title.trim()) {
      toast.error("Give this paper a title first.");
      return;
    }
    if (!file && text.trim().length < 20) {
      toast.error("Paste the questions or attach a file.");
      return;
    }


    setBusy(true);
    try {
      const result = await analyze({
        data: {
          title: title.trim(),
          subject: subject.trim() || null,
          syllabusText: syllabus.trim() || null,
          text: text.trim() || null,
          file: file ? { name: file.name, mime: file.mime, dataUrl: file.dataUrl } : null,
        },
      });
      toast.success(`Analysed ${result.questionCount} questions`);
      onDone();
      navigate({ to: "/exam/$examId", params: { examId: result.examSetId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel p-6">
      <h2 className="text-2xl">New analysis</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste questions or drop a question paper. Add the syllabus to measure coverage.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Paper title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Physics Mid-term 2026"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject / class</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Grade 11 Physics"
          />
        </div>
      </div>

      <Tabs defaultValue="paste" className="mt-6">
        <TabsList>
          <TabsTrigger value="paste">Paste text</TabsTrigger>
          <TabsTrigger value="upload">Upload file</TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="mt-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={"1. Define Newton's second law. (2 marks)\n2. Derive…"}
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void pick(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              dragging ? "border-accent bg-accent/10" : "border-border bg-muted/40 hover:bg-muted"
            }`}
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Drag & drop a question paper</p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, or a photo/scan of a printed or handwritten paper (max 15 MB)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={(e) => void pick(e.target.files)}
            />
          </div>

          {file && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
              {file.mime.startsWith("image/") ? (
                <ImageIcon className="size-4 text-muted-foreground" />
              ) : (
                <FileText className="size-4 text-muted-foreground" />
              )}
              <span className="flex-1 truncate text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                aria-label="Remove file"
              >
                <X className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-6 space-y-2">
        <Label htmlFor="syllabus">Syllabus outline (optional)</Label>
        <Textarea
          id="syllabus"
          value={syllabus}
          onChange={(e) => setSyllabus(e.target.value)}
          rows={5}
          placeholder={"Unit 1: Kinematics\nUnit 2: Laws of motion\nUnit 3: Work, energy and power"}
        />
      </div>

      <Button onClick={submit} disabled={busy} className="mt-6 w-full sm:w-auto">
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Analysing…
          </>
        ) : (
          "Analyse paper"
        )}
      </Button>
    </section>
  );
}
