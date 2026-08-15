export function parseJsonFromModelResponse(rawText: string, label: string): unknown {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error(`${label} returned an empty response.`);
  }

  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} returned malformed JSON: ${message}`);
  }
}
