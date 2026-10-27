import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { title, category, description, organizer } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Missing event title" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        strategies: [
          "Prerequisite: Review core full-stack prototyping frameworks (Next.js/PostgreSQL).",
          "Pitch Angle: Emphasize clear student problem-solution fit with real-time sync.",
          "Winning Edge: Demo a live responsive MVP with active cloud storage rather than mockups."
        ]
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an engineering mentor helping college students prepare for an upcoming campus event.
      Event Title: "${title}"
      Category: "${category}"
      Organizer: "${organizer}"
      Description: "${description}"

      Generate exactly 3 short, actionable bullet points advising students on:
      1. What to brush up on beforehand
      2. The best angle/approach to stand out or win
      3. A key question judges or organizers will likely evaluate

      Keep each point under 20 words. Format strictly as plain text lines separated by newlines, with no markdown bullets or numbers.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const strategies = responseText
      .split("\n")
      .map((line) => line.replace(/^[\*\-\d\.\s]+/, "").trim())
      .filter((line) => line.length > 0)
      .slice(0, 3);

    return NextResponse.json({ strategies });
  } catch (err) {
    console.error("Gemini Event Prep API Error:", err);
    return NextResponse.json({
      strategies: [
        "Prerequisites: Prepare local starter kits and pre-configured database environments.",
        "Team Strategy: Divide workload cleanly between UI/UX integration and backend APIs.",
        "Presentation Tip: Keep presentation under 3 minutes with live feature walkthroughs."
      ]
    });
  }
}