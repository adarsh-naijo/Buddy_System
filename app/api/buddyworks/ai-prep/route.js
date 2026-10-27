import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { title, context, domain, type = "internship" } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        tips: [
          "Resume Focus: Showcase GitHub repo links with live deployed demos.",
          "Interview Prep: Review fundamentals in asynchronous operations and state management.",
          "Key Talking Point: Detail personal contributions in team hackathons or projects."
        ]
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a tech placement and academic mentor.
      Opportunity: "${title}"
      Category: "${type}"
      Details: "${context}"
      Domain: "${domain}"

      Provide exactly 3 concise, high-impact bullet points advising engineering students on:
      1. What exact project or skill to highlight on their resume
      2. The most probable technical interview question they will be asked
      3. A winning strategy to secure this role/mentorship slot

      Keep each point under 20 words. Plain text separated by newlines, no markdown bullets or numbers.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const tips = responseText
      .split("\n")
      .map((line) => line.replace(/^[\*\-\d\.\s]+/, "").trim())
      .filter((line) => line.length > 0)
      .slice(0, 3);

    return NextResponse.json({ tips });
  } catch (err) {
    console.error("BuddyWorks AI Prep Error:", err);
    return NextResponse.json({
      tips: [
        "Resume Focus: Highlight completed real-world projects with live links.",
        "Technical Focus: Master core language fundamentals and API architectures.",
        "Outreach Tip: Personalize your introductory note citing relevant coursework."
      ]
    });
  }
}