import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { content, subject, title, mode = "takeaways" } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      if (mode === "viva") {
        return NextResponse.json({
          items: [
            "Q: Explain the primary optimality criteria? | A: Optimal substructure ensures subproblem solutions combine into global optimum.",
            "Q: What is the worst-case space complexity? | A: O(N) when recursion call stack is unmemoized.",
            "Q: State one real-world trade-off. | A: Memory overhead vs computation latency."
          ]
        });
      }
      return NextResponse.json({
        items: [
          "Core definitions and key theoretical derivations.",
          "High priority for university end-semester questions.",
          "Includes key problem-solving algorithms and step diagrams."
        ]
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";
    if (mode === "viva") {
      prompt = `
        You are an engineering university examiner.
        Subject: "${subject}"
        Topic: "${title}"
        Content: "${content}"

        Generate exactly 3 high-yield university viva / exam interview questions based on this note.
        For each question, provide a punchy 1-sentence answer.
        Format strictly as:
        Q: [Question] | A: [Answer]

        Return ONLY the 3 lines, no extra headers or symbols.
      `;
    } else {
      prompt = `
        You are an engineering professor summarizing study notes.
        Subject: "${subject}"
        Note Title: "${title}"
        Content: "${content}"

        Extract exactly 3 concise, high-yield bullet points for exam preparation.
        Keep each bullet under 18 words. Return ONLY the 3 bullets separated by newlines, with no bullet characters or asterisks.
      `;
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const items = responseText
      .split("\n")
      .map((line) => line.replace(/^[\*\-\d\.\s]+/, "").trim())
      .filter((line) => line.length > 0)
      .slice(0, 3);

    return NextResponse.json({ items });
  } catch (err) {
    console.error("Gemini API Error:", err);
    return NextResponse.json({
      items: [
        "Core foundational concept review.",
        "Crucial formulas and standard procedural derivations.",
        "Primary model questions frequently appearing in university exams."
      ]
    });
  }
}