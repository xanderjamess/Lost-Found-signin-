type ChatMessage = { role: "user" | "model"; content: string };

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error || res.statusText;
  } catch {
    return res.statusText;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export const api = {
  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    const res = await fetch(`/api/chat-history/${userId}`);
    if (!res.ok) {
      throw new Error(await parseError(res));
    }
    return res.json();
  },

  async saveChatHistory(userId: string, history: ChatMessage[]): Promise<void> {
    await postJson(`/api/chat-history/${userId}`, { history });
  },

  ai: {
    analyze(report: unknown, otherItems: unknown[]) {
      return postJson<Record<string, unknown>>("/api/ai/analyze", { report, otherItems });
    },

    chat(message: string, history: { role: string; parts: { text: string }[] }[]) {
      return postJson<{ reply: string }>("/api/ai/chat", { message, history });
    },

    imageSearch(imageDataUrl: string) {
      return postJson<{ keywords: string }>("/api/ai/image-search", { image: imageDataUrl });
    },
  },
};
