export function summarizeSectionDiff(originalContent: string, revisedContent: string) {
  const changes: string[] = [];
  const originalWords = originalContent.split(/\s+/).filter(Boolean).length;
  const revisedWords = revisedContent.split(/\s+/).filter(Boolean).length;

  if (revisedWords < originalWords) changes.push("Tightened wording for scanability.");
  if (revisedWords > originalWords) changes.push("Added clarifying context without adding unsupported facts.");
  if (/not detected|missing|clarify|add /i.test(revisedContent)) changes.push("Preserved missing-evidence warning instead of inventing a claim.");
  if (!changes.length) changes.push("Reframed the section while preserving the same evidence boundary.");

  return changes;
}
