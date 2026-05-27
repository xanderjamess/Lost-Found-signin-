import { api } from "../lib/api";
import { Item } from "../types";

export async function analyzeReportWithAI(report: Item, otherItems: Item[]): Promise<unknown> {
  return api.ai.analyze(report, otherItems);
}

export async function chatWithAI(
  message: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> {
  const { reply } = await api.ai.chat(message, history);
  return reply;
}
