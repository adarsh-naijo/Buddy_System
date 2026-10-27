import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { day, subjectsToday, examTarget } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        plan: [
          "06:30 PM - 07:30 PM: High cognitive load - solve 2 practice problems in Advanced Data Structures.",
          "07:45 PM - 08:45 PM: VLSI Design - review Stick Diagrams and Euler Path rules.",
          "09:15 PM - 10:00 PM: Quick recall - Pattern Recognition Bayes Decision theory flash notes.",
          "10:00 PM - 10:20 PM: 20-minute daily review of upcoming exam topics."
        ]
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an engineering academic mentor designing an evening study plan for college students.
      Day of Week: "${day}"
      Subjects attended today in college: "${subjectsToday.join(", ")}"
      Upcoming University Exam: "${examTarget}"

      Generate a smart 4-phase evening study routine (between 06:00 PM and 10:30 PM).
      Balance algorithmic problem-solving with lighter concept revision so students don't burn out.
      
      Format strictly as 4 concise lines (time slot + exact task). Under 18 words per line. No asterisks or bullets.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const plan = responseText
      .split("\n")
      .map((line) => line.replace(/^[\*\-\d\.\s]+/, "").trim())
      .filter((line) => line.length > 0)
      .slice(0, 4);

    return NextResponse.json({ plan });
  } catch (err) {
    console.error("Gemini Timetable Plan API Error:", err);
    return NextResponse.json({
      plan: [
        "06:30 PM - 07:30 PM: Solve 2 DP and Greedy matrix problems.",
        "07:45 PM - 08:30 PM: Review VLSI Lambda layout rules.",
        "09:00 PM - 09:45 PM: Minimum Risk Classification formulas in Pattern Recognition.",
        "10:00 PM - 10:30 PM: Consolidate lab practical viva questions."
      ]
    });
  }
}