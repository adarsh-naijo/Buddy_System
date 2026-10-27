"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  User,
  ShieldCheck,
  Edit2,
  X,
  Plus,
  Timer,
  CheckCircle2,
  Loader2,
  ThumbsUp,
  Tag,
  Trash2,
  Users
} from "lucide-react";

const DEFAULT_TIMETABLE_FALLBACK = [
  // Monday
  { id: "mon-1", day_of_week: "Monday", period_no: 1, time_slot: "09:00 - 09:55 AM", subject: "Advanced Data Structures", room: "Room 304", faculty: "Dr. George K." },
  { id: "mon-2", day_of_week: "Monday", period_no: 2, time_slot: "09:55 - 10:50 AM", subject: "VLSI Design", room: "Room 304", faculty: "Prof. Priya M." },
  { id: "mon-3", day_of_week: "Monday", period_no: 3, time_slot: "11:05 - 12:00 PM", subject: "Pattern Recognition", room: "Room 304", faculty: "Dr. Arun V." },
  { id: "mon-4", day_of_week: "Monday", period_no: 4, time_slot: "12:50 - 01:45 PM", subject: "Database Management Systems", room: "Room 304", faculty: "Prof. Simi E." },
  { id: "mon-5", day_of_week: "Monday", period_no: 5, time_slot: "01:45 - 02:40 PM", subject: "ADS Lab / DBMS Lab", room: "Lab 2 / Lab 4", faculty: "Faculty Team" },
  { id: "mon-6", day_of_week: "Monday", period_no: 6, time_slot: "02:45 - 03:40 PM", subject: "ADS Lab / DBMS Lab", room: "Lab 2 / Lab 4", faculty: "Faculty Team" },

  // Tuesday
  { id: "tue-1", day_of_week: "Tuesday", period_no: 1, time_slot: "09:00 - 09:55 AM", subject: "Database Management Systems", room: "Room 304", faculty: "Prof. Simi E." },
  { id: "tue-2", day_of_week: "Tuesday", period_no: 2, time_slot: "09:55 - 10:50 AM", subject: "Advanced Data Structures", room: "Room 304", faculty: "Dr. George K." },
  { id: "tue-3", day_of_week: "Tuesday", period_no: 3, time_slot: "11:05 - 12:00 PM", subject: "VLSI Design", room: "Room 304", faculty: "Prof. Priya M." },
  { id: "tue-4", day_of_week: "Tuesday", period_no: 4, time_slot: "12:50 - 01:45 PM", subject: "Pattern Recognition", room: "Room 304", faculty: "Dr. Arun V." },
  { id: "tue-5", day_of_week: "Tuesday", period_no: 5, time_slot: "01:45 - 02:40 PM", subject: "Constitution of India / Ethics", room: "Room 304", faculty: "Prof. Jacob P." },
  { id: "tue-6", day_of_week: "Tuesday", period_no: 6, time_slot: "02:45 - 03:40 PM", subject: "Project & Placement Training", room: "Seminar Hall", faculty: "Placement Cell" },

  // Wednesday
  { id: "wed-1", day_of_week: "Wednesday", period_no: 1, time_slot: "09:00 - 09:55 AM", subject: "Pattern Recognition", room: "Room 304", faculty: "Dr. Arun V." },
  { id: "wed-2", day_of_week: "Wednesday", period_no: 2, time_slot: "09:55 - 10:50 AM", subject: "Advanced Data Structures", room: "Room 304", faculty: "Dr. George K." },
  { id: "wed-3", day_of_week: "Wednesday", period_no: 3, time_slot: "11:05 - 12:00 PM", subject: "Database Management Systems", room: "Room 304", faculty: "Prof. Simi E." },
  { id: "wed-4", day_of_week: "Wednesday", period_no: 4, time_slot: "12:50 - 01:45 PM", subject: "VLSI Design", room: "Room 304", faculty: "Prof. Priya M." },
  { id: "wed-5", day_of_week: "Wednesday", period_no: 5, time_slot: "01:45 - 02:40 PM", subject: "Microcontroller Prototyping", room: "FabLab", faculty: "Technical Staff" },
  { id: "wed-6", day_of_week: "Wednesday", period_no: 6, time_slot: "02:45 - 03:40 PM", subject: "Library / Peer Circle", room: "Central Library", faculty: "Self-paced" },

  // Thursday
  { id: "thu-1", day_of_week: "Thursday", period_no: 1, time_slot: "09:00 - 09:55 AM", subject: "VLSI Design", room: "Room 304", faculty: "Prof. Priya M." },
  { id: "thu-2", day_of_week: "Thursday", period_no: 2, time_slot: "09:55 - 10:50 AM", subject: "Pattern Recognition", room: "Room 304", faculty: "Dr. Arun V." },
  { id: "thu-3", day_of_week: "Thursday", period_no: 3, time_slot: "11:05 - 12:00 PM", subject: "Advanced Data Structures", room: "Room 304", faculty: "Dr. George K." },
  { id: "thu-4", day_of_week: "Thursday", period_no: 4, time_slot: "12:50 - 01:45 PM", subject: "Database Management Systems", room: "Room 304", faculty: "Prof. Simi E." },
  { id: "thu-5", day_of_week: "Thursday", period_no: 5, time_slot: "01:45 - 02:40 PM", subject: "Hardware & IoT Lab", room: "Embedded Lab", faculty: "Prof. Mathew K." },
  { id: "thu-6", day_of_week: "Thursday", period_no: 6, time_slot: "02:45 - 03:40 PM", subject: "Hardware & IoT Lab", room: "Embedded Lab", faculty: "Prof. Mathew K." },

  // Friday
  { id: "fri-1", day_of_week: "Friday", period_no: 1, time_slot: "09:00 - 09:55 AM", subject: "Database Management Systems", room: "Room 304", faculty: "Prof. Simi E." },
  { id: "fri-2", day_of_week: "Friday", period_no: 2, time_slot: "09:55 - 10:50 AM", subject: "VLSI Design", room: "Room 304", faculty: "Prof. Priya M." },
  { id: "fri-3", day_of_week: "Friday", period_no: 3, time_slot: "11:05 - 12:00 PM", subject: "Pattern Recognition", room: "Room 304", faculty: "Dr. Arun V." },
  { id: "fri-4", day_of_week: "Friday", period_no: 4, time_slot: "12:50 - 01:45 PM", subject: "Advanced Data Structures", room: "Room 304", faculty: "Dr. George K." },
  { id: "fri-5", day_of_week: "Friday", period_no: 5, time_slot: "01:45 - 02:40 PM", subject: "Hackathon / Project Sprint", room: "Incubation Center", faculty: "Student Mentors" },
  { id: "fri-6", day_of_week: "Friday", period_no: 6, time_slot: "02:45 - 03:40 PM", subject: "Mentor Interaction", room: "Staff Room 2", faculty: "Faculty Advisors" }
];

const DEFAULT_EXAMS_FALLBACK = [
  { id: "exam-1", title: "Series Exam 2: Data Structures & Algorithms", subject: "Advanced Data Structures", exam_date: "2026-11-15", exam_type: "Series Exam" },
  { id: "exam-2", title: "KTU S4 End-Semester Theory Exam", subject: "All S4 Core Subjects", exam_date: "2026-12-02", exam_type: "KTU University Exam" },
  { id: "exam-3", title: "VLSI Stick Diagram & CMOS Practical Viva", subject: "VLSI Design Lab", exam_date: "2026-11-20", exam_type: "Lab Exam" }
];

const DEFAULT_PEER_FALLBACK = [
  {
    id: "peer-1",
    author: "Mathews S.",
    title: "Heavy Theory & Lab Practical Night Sprint",
    target_hours: 4,
    schedule: "06:30 - 08:00 PM: Solve 2 DP Matrix Chain problems | 08:30 - 09:30 PM: Redraw VLSI CMOS Stick Diagrams | 10:00 - 10:45 PM: PR Bayes Risk formula sheet review",
    tags: "ADS, VLSI, Night Routine",
    upvotes: 14
  },
  {
    id: "peer-2",
    author: "Thomas B.",
    title: "Early Morning 2-Hour Quick Recall",
    target_hours: 2,
    schedule: "05:30 - 06:30 AM: Advanced Data Structures derivations | 06:30 - 07:15 AM: Pattern Recognition discriminant functions",
    tags: "Morning, Fast Revision",
    upvotes: 9
  }
];

export default function TimetablePlanner() {
  const { user, profile } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams] = useState([]);
  const [peerTimetables, setPeerTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [subTab, setSubTab] = useState("schedule");

  // Admin Controls
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Edit Timetable Slot Modal
  const [editingSlot, setEditingSlot] = useState(null);
  const [isUpdatingSlot, setIsUpdatingSlot] = useState(false);

  // Add Custom Period Modal
  const [showAddPeriodModal, setShowAddPeriodModal] = useState(false);
  const [isAddingPeriod, setIsAddingPeriod] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    day_of_week: "Monday",
    period_no: 1,
    time_slot: "09:00 - 09:55 AM",
    subject: "",
    room: "",
    faculty: "",
  });

  // Add Exam Modal
  const [showExamModal, setShowExamModal] = useState(false);
  const [newExam, setNewExam] = useState({
    title: "",
    subject: "Advanced Data Structures",
    exam_date: "",
    exam_type: "Series Exam",
  });

  // Add Peer Timetable Modal
  const [showPeerModal, setShowPeerModal] = useState(false);
  const [newPeerPlan, setNewPeerPlan] = useState({
    title: "",
    author: "Adarsh Naijo",
    target_hours: 3,
    schedule: "",
    tags: "S4, Core Revision",
  });

  const [upvotedPeers, setUpvotedPeers] = useState([]);

  // AI Study Plan State
  const [aiPlan, setAiPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Countdown State
  const [selectedExamId, setSelectedExamId] = useState("");
  const [daysLeft, setDaysLeft] = useState(0);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const currentUserName = profile?.full_name || user?.user_metadata?.full_name || "Adarsh Naijo";

  const fetchData = async () => {
    try {
      setLoading(true);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase fetch timeout")), 2500)
      );

      const queries = Promise.all([
        supabase.from("timetables").select("*").order("period_no", { ascending: true }),
        supabase.from("exams").select("*").order("exam_date", { ascending: true }),
        supabase.from("peer_timetables").select("*").order("upvotes", { ascending: false }),
      ]);

      const [ttRes, exRes, peerRes] = await Promise.race([queries, timeoutPromise]);

      setTimetable(ttRes.data && ttRes.data.length > 0 ? ttRes.data : DEFAULT_TIMETABLE_FALLBACK);

      if (exRes.data && exRes.data.length > 0) {
        setExams(exRes.data);
        if (!selectedExamId) setSelectedExamId(exRes.data[0].id);
      } else {
        setExams(DEFAULT_EXAMS_FALLBACK);
        if (!selectedExamId) setSelectedExamId(DEFAULT_EXAMS_FALLBACK[0].id);
      }

      setPeerTimetables(peerRes.data && peerRes.data.length > 0 ? peerRes.data : DEFAULT_PEER_FALLBACK);
    } catch (err) {
      console.warn("Using timetable fallback defaults due to timeout:", err);
      setTimetable(DEFAULT_TIMETABLE_FALLBACK);
      setExams(DEFAULT_EXAMS_FALLBACK);
      if (!selectedExamId) setSelectedExamId(DEFAULT_EXAMS_FALLBACK[0].id);
      setPeerTimetables(DEFAULT_PEER_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const savedUpvotes = localStorage.getItem("buddy_peer_upvotes");
    if (savedUpvotes) {
      try {
        setUpvotedPeers(JSON.parse(savedUpvotes));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!selectedExamId || exams.length === 0) return;
    const current = exams.find((e) => e.id === selectedExamId);
    if (!current) return;

    const calculateDays = () => {
      const target = new Date(current.exam_date).getTime();
      const now = new Date().getTime();
      const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      setDaysLeft(diff > 0 ? diff : 0);
    };

    calculateDays();
  }, [selectedExamId, exams]);

  const currentDaySlots = timetable
    .filter((slot) => slot.day_of_week === selectedDay)
    .sort((a, b) => Number(a.period_no) - Number(b.period_no));

  const activeExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  const handleTogglePeerUpvote = async (peer) => {
    const hasUpvoted = upvotedPeers.includes(peer.id);
    const updatedList = hasUpvoted
      ? upvotedPeers.filter((id) => id !== peer.id)
      : [...upvotedPeers, peer.id];

    setUpvotedPeers(updatedList);
    localStorage.setItem("buddy_peer_upvotes", JSON.stringify(updatedList));

    const newCount = (peer.upvotes || 0) + (hasUpvoted ? -1 : 1);

    setPeerTimetables((prev) =>
      prev.map((p) => (p.id === peer.id ? { ...p, upvotes: newCount } : p))
    );

    try {
      await supabase
        .from("peer_timetables")
        .update({ upvotes: newCount })
        .eq("id", peer.id);
    } catch (e) {}
  };

  // Add / Overwrite Period Slot
  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    if (!newPeriod.subject || !newPeriod.room) {
      alert("Please provide the subject and room/venue.");
      return;
    }

    setIsAddingPeriod(true);
    const targetDay = newPeriod.day_of_week;
    const targetPeriodNo = Number(newPeriod.period_no);

    const existingSlot = timetable.find(
      (s) => s.day_of_week === targetDay && Number(s.period_no) === targetPeriodNo
    );

    if (existingSlot) {
      const confirmOverwrite = confirm(
        `Period ${targetPeriodNo} already exists on ${targetDay} ("${existingSlot.subject}"). Overwrite it?`
      );

      if (confirmOverwrite) {
        try {
          await supabase
            .from("timetables")
            .update({
              subject: newPeriod.subject,
              room: newPeriod.room,
              faculty: newPeriod.faculty || "Faculty",
              time_slot: newPeriod.time_slot,
            })
            .eq("id", existingSlot.id);

          setTimetable((prev) =>
            prev.map((s) =>
              s.id === existingSlot.id
                ? {
                    ...s,
                    subject: newPeriod.subject,
                    room: newPeriod.room,
                    faculty: newPeriod.faculty || "Faculty",
                    time_slot: newPeriod.time_slot,
                  }
                : s
            )
          );
          setSelectedDay(targetDay);
          setShowAddPeriodModal(false);
        } catch (err) {
          console.error("Overwrite failed:", err);
        } finally {
          setIsAddingPeriod(false);
        }
        return;
      }
    }

    const payload = {
      id: `slot-${Date.now()}`,
      day_of_week: targetDay,
      period_no: targetPeriodNo,
      time_slot: newPeriod.time_slot,
      subject: newPeriod.subject,
      room: newPeriod.room,
      faculty: newPeriod.faculty || "Faculty",
      batch: "S4 CSE",
    };

    try {
      await supabase.from("timetables").insert([payload]);
      setTimetable((prev) => [...prev, payload]);
      setSelectedDay(targetDay);
      setShowAddPeriodModal(false);
      setNewPeriod({
        day_of_week: targetDay,
        period_no: currentDaySlots.length + 1,
        time_slot: "09:00 - 09:55 AM",
        subject: "",
        room: "",
        faculty: "",
      });
    } catch (err) {
      console.error("Failed to add custom period:", err);
    } finally {
      setIsAddingPeriod(false);
    }
  };

  const handleDeleteSlot = async (slot) => {
    if (confirm(`Remove Period ${slot.period_no} ("${slot.subject}") from ${slot.day_of_week}?`)) {
      setTimetable((prev) => prev.filter((s) => s.id !== slot.id));
      try {
        await supabase.from("timetables").delete().eq("id", slot.id);
      } catch (e) {}
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!newExam.title || !newExam.exam_date) {
      alert("Please provide the exam title and date.");
      return;
    }

    const payload = {
      id: `exam-${Date.now()}`,
      title: newExam.title,
      subject: newExam.subject,
      exam_date: newExam.exam_date,
      exam_type: newExam.exam_type,
    };

    try {
      await supabase.from("exams").insert([payload]);
      setExams((prev) => [...prev, payload]);
      setSelectedExamId(payload.id);
      setShowExamModal(false);
      setNewExam({
        title: "",
        subject: "Advanced Data Structures",
        exam_date: "",
        exam_type: "Series Exam",
      });
    } catch (err) {
      console.error("Failed to add exam:", err);
    }
  };

  const handleCreatePeerPlan = async (e) => {
    e.preventDefault();
    if (!newPeerPlan.title || !newPeerPlan.schedule) {
      alert("Please provide a title and study breakdown.");
      return;
    }

    const payload = {
      id: `peer-${Date.now()}`,
      author: newPeerPlan.author || currentUserName,
      title: newPeerPlan.title,
      target_hours: Number(newPeerPlan.target_hours),
      schedule: newPeerPlan.schedule,
      tags: newPeerPlan.tags || "Revision",
      upvotes: 1,
    };

    try {
      await supabase.from("peer_timetables").insert([payload]);
      setPeerTimetables((prev) => [payload, ...prev]);
      setShowPeerModal(false);
      setNewPeerPlan({
        title: "",
        author: currentUserName,
        target_hours: 3,
        schedule: "",
        tags: "S4, Core Revision",
      });
    } catch (err) {
      console.error("Failed to post peer plan:", err);
    }
  };

  const handleSlotSave = async (e) => {
    e.preventDefault();
    setIsUpdatingSlot(true);

    try {
      await supabase
        .from("timetables")
        .update({
          subject: editingSlot.subject,
          room: editingSlot.room,
          faculty: editingSlot.faculty,
          time_slot: editingSlot.time_slot,
          period_no: Number(editingSlot.period_no),
        })
        .eq("id", editingSlot.id);

      setTimetable((prev) =>
        prev.map((s) => (s.id === editingSlot.id ? { ...editingSlot } : s))
      );
      setEditingSlot(null);
    } catch (err) {
      console.error("Slot update failed:", err);
    } finally {
      setIsUpdatingSlot(false);
    }
  };

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminPinInput === "4040") {
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminPinInput("");
    } else {
      alert("Incorrect Admin PIN. Access denied.");
      setAdminPinInput("");
    }
  };

  const handleGenerateStudyPlan = async () => {
    setLoadingPlan(true);
    const uniqueSubjects = [...new Set(currentDaySlots.map((s) => s.subject))];

    try {
      const res = await fetch("/api/timetable/ai-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: selectedDay,
          subjectsToday: uniqueSubjects,
          examTarget: activeExam ? activeExam.title : "University Exams",
        }),
      });

      const data = await res.json();
      setAiPlan(data.plan);
    } catch (err) {
      console.error("Failed to generate AI study plan:", err);
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="text-indigo-600" /> Smart Timetable & Exams
            </h2>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              S4 CSE Batch
            </span>
            {isAdmin && (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> ADMIN ACTIVE
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Build custom class schedules, track upcoming exams, share peer routines, and generate AI revision plans.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin ? (
            <button
              onClick={() => setIsAdmin(false)}
              className="text-xs font-semibold px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50"
            >
              Exit Admin
            </button>
          ) : (
            <button
              onClick={() => setShowAdminModal(true)}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-xs px-2.5 py-2 rounded-lg border border-gray-200 bg-white"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Admin
            </button>
          )}

          <button
            onClick={() => {
              setNewPeriod((prev) => ({
                ...prev,
                day_of_week: selectedDay,
                period_no: currentDaySlots.length + 1,
              }));
              setShowAddPeriodModal(true);
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Set Period
          </button>

          <button
            onClick={() => setShowExamModal(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Add Exam
          </button>

          <button
            onClick={() => setShowPeerModal(true)}
            className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" /> Share Routine
          </button>
        </div>
      </div>

      {/* Dynamic Exam Countdown */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 border border-indigo-900/50">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
            <Timer className="w-4 h-4 text-amber-400" /> Active Exam Countdown Target
          </div>

          {activeExam ? (
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                {activeExam.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-indigo-200">
                <span className="bg-indigo-800/80 px-2 py-0.5 rounded text-[11px] font-medium text-indigo-100">
                  {activeExam.exam_type}
                </span>
                <span>Subject: {activeExam.subject}</span>
                <span>•</span>
                <span>Date: {new Date(activeExam.exam_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-300">No upcoming exams registered.</p>
          )}

          {exams.length > 1 && (
            <div className="pt-1 flex items-center gap-2">
              <span className="text-[11px] text-indigo-300 font-medium">Switch Target:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="bg-indigo-900/80 border border-indigo-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id} className="bg-slate-900 text-white">
                    {ex.title} ({ex.exam_type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/10 shrink-0">
          <div className="text-center">
            <span className="text-3xl font-extrabold text-amber-300 block">{daysLeft}</span>
            <span className="text-[10px] font-medium text-indigo-100 uppercase tracking-wider">Days Remaining</span>
          </div>
          <div className="h-9 w-px bg-white/20" />
          <div className="text-xs text-indigo-100 space-y-0.5">
            <span className="font-semibold text-white block">Daily Cadence</span>
            <span className="text-[11px] text-indigo-200">2.5 hrs theory + 1 hr problem sets</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab("schedule")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === "schedule"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Weekly Class Periods
          </button>
          <button
            onClick={() => setSubTab("peer")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === "peer"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Peer Shared Routines ({peerTimetables.length})
          </button>
        </div>

        {subTab === "schedule" && (
          <button
            onClick={handleGenerateStudyPlan}
            disabled={loadingPlan}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loadingPlan ? "animate-spin" : ""}`} />
            {loadingPlan ? "Balancing..." : "AI Study Routine"}
          </button>
        )}
      </div>

      {/* VIEW 1: WEEKLY CLASS SCHEDULE */}
      {subTab === "schedule" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {daysOfWeek.map((day) => {
              const isActive = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* AI Plan Drawer */}
          {aiPlan && (
            <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-5 space-y-3 animate-in fade-in duration-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-950">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Gemini Study Balancer for {selectedDay}:
                </div>
                <button
                  onClick={() => setAiPlan(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {aiPlan.map((step, idx) => (
                  <div key={idx} className="bg-white border border-indigo-100 rounded-xl p-3 flex items-start gap-2.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-indigo-950 font-medium leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm">Connecting to timetable...</p>
            </div>
          ) : currentDaySlots.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-3">
              <p className="text-sm text-gray-500 font-medium">No periods scheduled for {selectedDay}.</p>
              <button
                onClick={() => {
                  setNewPeriod((prev) => ({ ...prev, day_of_week: selectedDay, period_no: 1 }));
                  setShowAddPeriodModal(true);
                }}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Period for {selectedDay}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentDaySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="border border-gray-200 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                        Period {slot.period_no}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {slot.time_slot}
                      </div>
                    </div>

                    <h4 className="font-bold text-gray-900 text-base leading-snug">
                      {slot.subject}
                    </h4>

                    <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-medium text-gray-800">{slot.room}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{slot.faculty}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => handleDeleteSlot(slot)}
                      className="text-gray-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                      title="Delete Period"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingSlot({ ...slot })}
                      className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800 px-2.5 py-1.5 rounded-md bg-indigo-50 border border-indigo-100 hover:bg-indigo-100"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Period
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PEER-SHARED ROUTINES */}
      {subTab === "peer" && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Personalized revision schedules created and verified by classmates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {peerTimetables.map((peer) => {
              const isUpvoted = upvotedPeers.includes(peer.id);
              const scheduleSteps = peer.schedule.split("|").map((s) => s.trim());

              return (
                <div
                  key={peer.id}
                  className="border border-gray-200 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {peer.target_hours} Hours Target
                      </span>

                      <button
                        onClick={() => handleTogglePeerUpvote(peer)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all active:scale-95 ${
                          isUpvoted
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <ThumbsUp className={`w-3 h-3 ${isUpvoted ? "fill-white" : ""}`} />
                        <span>{peer.upvotes || 0}</span>
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 text-base leading-snug">
                        {peer.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Shared by <span className="font-semibold text-gray-700">{peer.author}</span>
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      {scheduleSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-gray-400" /> {peer.tags}
                    </span>
                    <span className="text-emerald-600 font-semibold">Peer Verified</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM CLASS PERIOD */}
      {showAddPeriodModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden text-gray-900">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> Add Custom Class Period
              </h3>
              <button onClick={() => setShowAddPeriodModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Day of Week</label>
                  <select
                    value={newPeriod.day_of_week}
                    onChange={(e) => setNewPeriod({ ...newPeriod, day_of_week: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {daysOfWeek.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Period No</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newPeriod.period_no}
                    onChange={(e) => setNewPeriod({ ...newPeriod, period_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Time Slot *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 09:00 - 09:55 AM"
                  value={newPeriod.time_slot}
                  onChange={(e) => setNewPeriod({ ...newPeriod, time_slot: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Compiler Design / Machine Learning"
                  value={newPeriod.subject}
                  onChange={(e) => setNewPeriod({ ...newPeriod, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Room / Venue *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 304 / Lab 3"
                    value={newPeriod.room}
                    onChange={(e) => setNewPeriod({ ...newPeriod, room: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Faculty In-Charge</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. George K."
                    value={newPeriod.faculty}
                    onChange={(e) => setNewPeriod({ ...newPeriod, faculty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddPeriodModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingPeriod}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isAddingPeriod && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isAddingPeriod ? "Saving..." : "Add to Timetable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXAM / TEST */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden text-gray-900">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> Register New Exam / Test
              </h3>
              <button onClick={() => setShowExamModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Exam / Test Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Series Exam 2: Data Structures & Algorithms"
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={newExam.subject}
                    onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                  <select
                    value={newExam.exam_type}
                    onChange={(e) => setNewExam({ ...newExam, exam_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Series Exam">Series Exam</option>
                    <option value="Lab Exam">Lab Exam</option>
                    <option value="KTU University Exam">KTU University Exam</option>
                    <option value="Class Test">Class Test</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Exam Date *</label>
                <input
                  type="date"
                  required
                  value={newExam.exam_date}
                  onChange={(e) => setNewExam({ ...newExam, exam_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Save Exam Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SHARE PEER TIMETABLE */}
      {showPeerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden text-gray-900">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> Share Study Routine With Classmates
              </h3>
              <button onClick={() => setShowPeerModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePeerPlan} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Routine Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADS Matrix Chain & VLSI 3-Hour Sprint"
                  value={newPeerPlan.title}
                  onChange={(e) => setNewPeerPlan({ ...newPeerPlan, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={newPeerPlan.author}
                    onChange={(e) => setNewPeerPlan({ ...newPeerPlan, author: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Target (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newPeerPlan.target_hours}
                    onChange={(e) => setNewPeerPlan({ ...newPeerPlan, target_hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Routine Breakdown (Separate steps using the pipe symbol | ) *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="06:00 - 07:30 PM: Solve 2 ADS DP problems | 08:00 - 09:00 PM: VLSI Stick Diagrams"
                  value={newPeerPlan.schedule}
                  onChange={(e) => setNewPeerPlan({ ...newPeerPlan, schedule: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. ADS, VLSI, Night Routine"
                  value={newPeerPlan.tags}
                  onChange={(e) => setNewPeerPlan({ ...newPeerPlan, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPeerModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Publish Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TIMETABLE SLOT */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden text-gray-900">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" /> Edit Period {editingSlot.period_no} ({editingSlot.day_of_week})
              </h3>
              <button onClick={() => setEditingSlot(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSlotSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={editingSlot.subject}
                  onChange={(e) => setEditingSlot({ ...editingSlot, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Period Number</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={editingSlot.period_no}
                    onChange={(e) => setEditingSlot({ ...editingSlot, period_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    required
                    value={editingSlot.time_slot}
                    onChange={(e) => setEditingSlot({ ...editingSlot, time_slot: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Room / Lab Venue *</label>
                <input
                  type="text"
                  required
                  value={editingSlot.room}
                  onChange={(e) => setEditingSlot({ ...editingSlot, room: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Faculty / Instructor</label>
                <input
                  type="text"
                  required
                  value={editingSlot.faculty}
                  onChange={(e) => setEditingSlot({ ...editingSlot, faculty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSlot}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdatingSlot && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isUpdatingSlot ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN ACCESS */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Admin Access
              </h3>
              <button onClick={() => setShowAdminModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdminAuth} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Enter Master PIN</label>
                <input
                  type="password"
                  placeholder="••••"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-semibold"
              >
                Unlock Admin Controls
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}