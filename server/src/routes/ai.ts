// server/src/routes/ai.ts
import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post("/analyze", async (req: Request, res: Response) => {
  const { code, domain, type, message, history } = req.body;

  if (!code && !message) {
    return res.status(400).json({ error: "code or message required" });
  }

  try {
    let prompt = "";

    if (type === "analyze") {
      prompt = `You are an expert ${domain} developer inside DevSpace IDE. Analyze this code:

\`\`\`
${code}
\`\`\`

Give a structured response with:
1. **Status**: Quick verdict (✅ Clean / ⚠️ Has Issues / ❌ Critical Errors)
2. **Issues**: List any bugs, errors, or improvements (be specific with line references)
3. **Fix**: If issues exist, provide the complete fixed code in a code block

Keep it concise and developer-friendly.`;
    } else if (type === "chat") {
      const contextHistory = (history || []).map((m: { role: string; text: string }) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      }));

      const messages = [
        ...contextHistory,
        {
          role: "user" as const,
          content: `Current code context:\n\`\`\`\n${code?.slice(0, 800) ?? ""}${(code?.length ?? 0) > 800 ? "\n... (truncated)" : ""}\n\`\`\`\n\nUser: ${message}`,
        },
      ];

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1500,
        system: `You are an expert ${domain} developer assistant inside DevSpace IDE. Answer concisely and helpfully. If providing code, wrap it in triple backticks with the language.`,
        messages,
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const fixMatch = text.match(/```[\w]*\n([\s\S]+?)```/);
      const fixedCode = fixMatch?.[1]?.trim();

      return res.json({
        text: text.replace(/```[\w]*\n[\s\S]+?```/g, "[Code snippet below ↓]"),
        fixedCode,
      });
    } else if (type === "cross-domain") {
      prompt = `You are a senior full-stack architect reviewing code across multiple domains in DevSpace IDE.

${Object.entries(code as Record<string, string>)
  .map(([domain, src]) => `## ${domain}\n\`\`\`\n${src}\n\`\`\``)
  .join("\n\n")}

Analyze how these domains work together:
1. **Integration Issues**: Mismatches between frontend/backend/database
2. **API Contract**: Are the endpoints, types, and data shapes consistent?
3. **Improvements**: What would make them work better together?

Be specific and actionable.`;
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const fixMatch = text.match(/```[\w]*\n([\s\S]+?)```/);
    const fixedCode = fixMatch?.[1]?.trim();

    res.json({
      text: text.replace(/```[\w]*\n[\s\S]+?```/g, "[Fixed code below ↓]"),
      fixedCode,
    });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});

export default router;