export type SyllabusTopic = { name: string };

/**
 * Normalises syllabus input into a list of topic objects.
 * Accepts raw pasted text (one topic per line), an array of strings,
 * or an array of { name } objects — and always returns { name } objects.
 */
export function parseSyllabusTopics(input: unknown): SyllabusTopic[] {
  if (input == null) return [];

  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "name" in item) {
          return String((item as { name: unknown }).name).trim();
        }
        return "";
      })
      .filter(Boolean)
      .map((name) => ({ name }));
  }

  return String(input)
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

/** Joins parsed topics back into the plain-text form the prompt expects. */
export function syllabusTopicsToText(topics: SyllabusTopic[]): string | null {
  return topics.length ? topics.map((t) => t.name).join("\n") : null;
}
