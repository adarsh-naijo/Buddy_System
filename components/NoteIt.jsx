"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { 
  BookOpen, 
  Download, 
  Sparkles, 
  Search, 
  FileText, 
  CheckCircle2, 
  User, 
  Layers, 
  Upload, 
  Image as ImageIcon, 
  X, 
  FileCheck, 
  ThumbsUp, 
  HelpCircle, 
  Trash2, 
  ShieldCheck, 
  RotateCcw,
  Loader2,
  Globe,
  Filter
} from "lucide-react";

const DEFAULT_FALLBACK_NOTES = [
  {
    id: "note-seed-1",
    title: "Advanced Data Structures: B-Trees & Red-Black Tree Rotations",
    subject: "Advanced Data Structures",
    semester: "S4",
    module_no: 2,
    file_type: "pdf",
    author: "Adarsh Naijo",
    file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    raw_content: "Comprehensive revision notes covering B-Tree insertion properties, minimum degree t, splitting nodes, and Left-Leaning Red-Black tree rotations with balancing proofs.",
    upvotes: 12,
    user_id: "demo-user-101",
    user_email: "adarsh@vjcet.org"
  },
  {
    id: "note-seed-2",
    title: "VLSI Design: CMOS Stick Diagrams & Lambda Rules",
    subject: "VLSI Design",
    semester: "S4",
    module_no: 3,
    file_type: "image",
    author: "Thomas Benny",
    file_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    raw_content: "Euler path technique for stick diagram layouts, color codes for diffusion/polysilicon/metal layers, and lambda-based design rules for nMOS/pMOS transistors.",
    upvotes: 8,
    user_id: "user-thomas",
    user_email: "thomas@vjcet.org"
  },
  {
    id: "note-seed-3",
    title: "Pattern Recognition: Bayes Decision Theory & Risk Analysis",
    subject: "Pattern Recognition",
    semester: "S4",
    module_no: 1,
    file_type: "pdf",
    author: "Jeeva Jinesh",
    file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    raw_content: "Bayesian decision theory for pattern classification, minimum error-rate classification, loss functions, conditional risk, and Gaussian probability density estimation.",
    upvotes: 15,
    user_id: "user-jeeva",
    user_email: "jeeva@vjcet.org"
  }
];

export default function NoteIt() {
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [onlyMyNotes, setOnlyMyNotes] = useState(false);

  // Admin Session
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);

  // AI Content Cache
  const [takeaways, setTakeaways] = useState({});
  const [vivaQuestions, setVivaQuestions] = useState({});
  const [loadingAI, setLoadingAI] = useState({});

  // Local record of upvotes
  const [upvotedNotes, setUpvotedNotes] = useState([]);

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subject: "Advanced Data Structures",
    semester: "S4",
    moduleNo: 1,
    rawContent: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const currentUserName = profile?.full_name || user?.user_metadata?.full_name || "Adarsh Naijo";
  const currentUserId = user?.id || "demo-user-101";
  const currentUserEmail = user?.email || "student@vjcet.org";

  const fetchNotes = async () => {
    try {
      setLoading(true);

      // Safety timeout: If Supabase connection takes > 2 seconds, fail gracefully to seed data
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase timeout")), 2000)
      );

      const queryPromise = supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result;

      if (error || !data || data.length === 0) {
        setNotes(DEFAULT_FALLBACK_NOTES);
      } else {
        setNotes(data);
      }
    } catch (err) {
      console.warn("Using fallback local seeds due to network/query timeout:", err);
      setNotes(DEFAULT_FALLBACK_NOTES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    const savedUpvotes = localStorage.getItem("buddy_system_upvotes");
    if (savedUpvotes) {
      try {
        setUpvotedNotes(JSON.parse(savedUpvotes));
      } catch (e) {}
    }
  }, []);

  const semesters = ["All", ...new Set(notes.map((n) => n.semester))];
  const subjects = ["All", ...new Set(notes.map((n) => n.subject))];

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSem = selectedSemester === "All" || note.semester === selectedSemester;
    const matchesSub = selectedSubject === "All" || note.subject === selectedSubject;
    const matchesMyNotes = !onlyMyNotes || note.user_id === currentUserId || note.user_email === currentUserEmail;

    return matchesSearch && matchesSem && matchesSub && matchesMyNotes;
  });

  const handleToggleUpvote = async (note) => {
    const hasUpvoted = upvotedNotes.includes(note.id);
    const newUpvotesList = hasUpvoted
      ? upvotedNotes.filter((id) => id !== note.id)
      : [...upvotedNotes, note.id];

    setUpvotedNotes(newUpvotesList);
    localStorage.setItem("buddy_system_upvotes", JSON.stringify(newUpvotesList));

    const updatedCount = (note.upvotes || 0) + (hasUpvoted ? -1 : 1);

    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, upvotes: updatedCount } : n))
    );

    try {
      await supabase
        .from("notes")
        .update({ upvotes: updatedCount })
        .eq("id", note.id);
    } catch (e) {}
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    let type = "other";
    if (file.type.includes("pdf")) {
      type = "pdf";
    } else if (file.type.startsWith("image/")) {
      type = "image";
    }
    setFileType(type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !selectedFile || !previewUrl) {
      alert("Please fill all required fields and select an Image or PDF.");
      return;
    }

    setIsUploading(true);

    const newNote = {
      id: `note-${Date.now()}`,
      title: formData.title,
      subject: formData.subject,
      semester: formData.semester,
      module_no: Number(formData.moduleNo),
      file_type: fileType,
      author: currentUserName,
      user_id: currentUserId,
      user_email: currentUserEmail,
      file_url: previewUrl,
      raw_content: formData.rawContent || `${formData.title} covering ${formData.subject} Module ${formData.moduleNo}.`,
      upvotes: 1
    };

    try {
      const { error } = await supabase.from("notes").insert([newNote]);
      if (error) console.warn("Supabase insert error:", error);

      setNotes([newNote, ...notes]);
      setIsModalOpen(false);
      setSelectedFile(null);
      setFileType(null);
      setPreviewUrl(null);
      setFormData({
        title: "",
        subject: "Advanced Data Structures",
        semester: "S4",
        moduleNo: 1,
        rawContent: "",
      });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteNote = async (note) => {
    const isOwner = note.user_id === currentUserId || note.user_email === currentUserEmail;

    if (!isOwner && !isAdmin) {
      alert("Permission denied. Only the author or an Admin can delete this note.");
      return;
    }

    if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      try {
        await supabase.from("notes").delete().eq("id", note.id);
      } catch (e) {}
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

  const handleGenerateAI = async (note, mode) => {
    const cacheKey = `${note.id}-${mode}`;
    if (mode === "takeaways" && takeaways[note.id]) return;
    if (mode === "viva" && vivaQuestions[note.id]) return;

    setLoadingAI((prev) => ({ ...prev, [cacheKey]: true }));

    try {
      const res = await fetch("/api/notes/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: note.raw_content,
          subject: note.subject,
          title: note.title,
          mode: mode,
        }),
      });

      const data = await res.json();
      if (mode === "viva") {
        setVivaQuestions((prev) => ({ ...prev, [note.id]: data.items }));
      } else {
        setTakeaways((prev) => ({ ...prev, [note.id]: data.items }));
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setLoadingAI((prev) => ({ ...prev, [cacheKey]: false }));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="text-indigo-600" /> Note It
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-600" /> Live Cloud
            </span>
            {isAdmin && (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> ADMIN ACTIVE
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Logged in as <strong className="text-indigo-600">{currentUserName}</strong>. Upload, verify, and revise engineering materials.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Account Filter Toggle: All vs My Uploads */}
          <button
            onClick={() => setOnlyMyNotes(!onlyMyNotes)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              onlyMyNotes
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {onlyMyNotes ? "Viewing My Uploads" : "My Uploads"}
          </button>

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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" /> Upload Note
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search topic, subject, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {semesters.map((sem) => (
            <option key={sem} value={sem} className="text-gray-900 bg-white">
              {sem === "All" ? "All Semesters" : `Semester: ${sem}`}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {subjects.map((sub) => (
            <option key={sub} value={sub} className="text-gray-900 bg-white">
              {sub === "All" ? "All Subjects" : sub}
            </option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm">Connecting to Supabase cloud...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-700">No notes found.</p>
          <p className="text-xs text-gray-500">
            {onlyMyNotes ? "You haven't uploaded any study materials yet." : "Try adjusting your search filters or upload a note."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNotes.map((note) => {
            const hasTakeaways = takeaways[note.id];
            const hasViva = vivaQuestions[note.id];
            const isTakeawaysLoading = loadingAI[`${note.id}-takeaways`];
            const isVivaLoading = loadingAI[`${note.id}-viva`];

            const isImage = note.file_type === "image";
            const isUpvoted = upvotedNotes.includes(note.id);
            const isOwner = note.user_id === currentUserId || note.user_email === currentUserEmail;

            return (
              <div
                key={note.id}
                className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Module {note.module_no}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleUpvote(note)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all active:scale-95 ${
                          isUpvoted
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                        title="Upvote note"
                      >
                        <ThumbsUp className={`w-3 h-3 ${isUpvoted ? "fill-white" : ""}`} />
                        <span>{note.upvotes || 0}</span>
                      </button>

                      <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-[11px] font-medium">
                        {note.semester}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                          isImage
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {isImage ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {isImage ? "IMAGE" : "PDF"}
                      </span>

                      {(isOwner || isAdmin) && (
                        <button
                          onClick={() => handleDeleteNote(note)}
                          className="text-gray-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 text-base leading-snug">
                      {note.title}
                    </h3>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">{note.subject}</p>
                  </div>

                  {isImage && note.file_url && (
                    <div className="w-full h-40 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden relative">
                      <img
                        src={note.file_url}
                        alt={note.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      Uploaded by: <span className="font-medium text-gray-700">{note.author}</span>
                    </div>
                    {isOwner && (
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        Your Note
                      </span>
                    )}
                  </div>

                  {/* AI Takeaways */}
                  {hasTakeaways && (
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Key Exam Takeaways:
                      </div>
                      <ul className="space-y-1.5">
                        {hasTakeaways.map((bullet, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-indigo-950 flex items-start gap-1.5 leading-relaxed"
                          >
                            <CheckCircle2 className="w-3 h-3 text-indigo-600 mt-0.5 shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Viva Practice */}
                  {hasViva && (
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                        <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Exam / Viva Practice Questions:
                      </div>
                      <div className="space-y-2">
                        {hasViva.map((item, idx) => {
                          const parts = item.split("|");
                          const q = parts[0]?.replace(/^Q:\s*/, "") || item;
                          const a = parts[1]?.replace(/^A:\s*/, "") || "";
                          return (
                            <div key={idx} className="text-xs border-l-2 border-emerald-500 pl-2 space-y-0.5">
                              <p className="font-semibold text-emerald-950">
                                Q{idx + 1}: {q}
                              </p>
                              {a && <p className="text-emerald-800 font-normal">{a}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Toolbar */}
                <div className="border-t border-gray-100 bg-gray-50/70 p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleGenerateAI(note, "takeaways")}
                      disabled={isTakeawaysLoading}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Sparkles className={`w-3 h-3 ${isTakeawaysLoading ? "animate-spin" : ""}`} />
                      {isTakeawaysLoading ? "Loading..." : hasTakeaways ? "Takeaways ✓" : "AI Takeaways"}
                    </button>

                    <button
                      onClick={() => handleGenerateAI(note, "viva")}
                      disabled={isVivaLoading}
                      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <HelpCircle className={`w-3 h-3 ${isVivaLoading ? "animate-spin" : ""}`} />
                      {isVivaLoading ? "Generating..." : hasViva ? "Viva Prep ✓" : "AI Viva Prep"}
                    </button>
                  </div>

                  <a
                    href={note.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 active:scale-95 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isImage ? "View Image" : "PDF"}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden text-gray-900">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" /> Upload Study Material
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Note Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 2: CMOS Stick Diagrams & Rules"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                    <option value="S4">S4</option>
                    <option value="S5">S5</option>
                    <option value="S6">S6</option>
                    <option value="S7">S7</option>
                    <option value="S8">S8</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Module No</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.moduleNo}
                    onChange={(e) => setFormData({ ...formData, moduleNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Verified Author</label>
                  <input
                    type="text"
                    disabled
                    value={currentUserName}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Upload PDF or Diagram / Image *
                </label>
                <div className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer relative bg-gray-50/50">
                  <input
                    type="file"
                    required
                    accept=".pdf, image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-indigo-700 text-sm font-medium">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-center gap-2 text-gray-400">
                        <FileText className="w-6 h-6" />
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-gray-700 font-medium">
                        Click or drag to upload <span className="text-indigo-600">PDF</span> or{" "}
                        <span className="text-indigo-600">Image</span>
                      </p>
                      <p className="text-[11px] text-gray-500">Supported: PDF, JPG, PNG, WEBP (Up to 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Key Topics Covered (For AI Exam Takeaways & Viva Prep)
                </label>
                <textarea
                  rows="2"
                  placeholder="Mention topics inside this note for Gemini summary generation..."
                  value={formData.rawContent}
                  onChange={(e) => setFormData({ ...formData, rawContent: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isUploading ? "Uploading..." : "Post Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
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