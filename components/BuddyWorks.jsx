"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Users,
  Briefcase,
  Sparkles,
  Search,
  ExternalLink,
  Plus,
  X,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Loader2,
  Tag,
  DollarSign,
  Award,
  UserCheck,
  MessageSquare,
  Send,
  Eye,
  EyeOff,
  UserX,
  HelpCircle,
  Clock,
  ArrowRight,
  Inbox
} from "lucide-react";

export default function BuddyWorks() {
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'mentors' | 'internships'
  const [mentors, setMentors] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Admin Controls
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);

  // AI Advice Cache
  const [aiAdvice, setAiAdvice] = useState({});
  const [loadingAI, setLoadingAI] = useState({});

  // Mentorship Booking Local State
  const [requestedMentors, setRequestedMentors] = useState([]);

  // Modals
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showInternModal, setShowInternModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat Subsystem State
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userRole, setUserRole] = useState("fresher"); // 'fresher' | 'mentor'
  const [mentorRealName, setMentorRealName] = useState("Adarsh N. (S4 CSE)");
  const [revealIdentity, setRevealIdentity] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const chatScrollRef = useRef(null);

  // New Request Form State
  const [newRequestForm, setNewRequestForm] = useState({
    topic: "",
    question: "",
    category: "Academics",
  });

  // Mentor & Intern Form States
  const [mentorForm, setMentorForm] = useState({
    name: "Adarsh N.",
    role: "Peer Guide",
    domain: "MERN Stack & Cloud APIs",
    year_branch: "S4 CSE",
    bio: "",
    contact_link: "",
    slots_available: 3,
  });

  const [internForm, setInternForm] = useState({
    role_title: "",
    company: "",
    work_mode: "Remote",
    stipend: "₹10,000 / month",
    deadline: "",
    skills_required: "",
    description: "",
    apply_link: "",
  });

  // Fetch Core Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, iRes, rRes] = await Promise.all([
        supabase.from("mentors").select("*").order("created_at", { ascending: false }),
        supabase.from("internships").select("*").order("deadline", { ascending: true }),
        supabase.from("buddy_chat_rooms").select("*").order("created_at", { ascending: false }),
      ]);

      if (mRes.data) setMentors(mRes.data);
      if (iRes.data) setInternships(iRes.data);
      if (rRes.data) {
        setRooms(rRes.data);
        if (!currentRoom) {
          const active = rRes.data.find((r) => r.status === "active") || rRes.data[0];
          if (active) setCurrentRoom(active);
        }
      }
    } catch (err) {
      console.error("Error loading BuddyWorks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const savedRequests = localStorage.getItem("buddy_mentor_requests");
    if (savedRequests) {
      try {
        setRequestedMentors(JSON.parse(savedRequests));
      } catch (e) {}
    }
  }, []);

  // Fetch messages when currentRoom changes
  useEffect(() => {
    if (!currentRoom) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("buddy_messages")
        .select("*")
        .eq("room_id", currentRoom.id)
        .order("created_at", { ascending: true });

      setMessages(data || []);
      setRevealIdentity(currentRoom.reveal_mentor_identity || false);
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [currentRoom]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle Sending a Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRoom) return;

    setIsSending(true);

    let senderDisplayName = currentRoom.fresher_alias;
    if (userRole === "mentor") {
      senderDisplayName = revealIdentity
        ? currentRoom.mentor_real_name || mentorRealName
        : currentRoom.mentor_alias || "Senior Buddy";
    }

    const payload = {
      id: `msg-${Date.now()}`,
      room_id: currentRoom.id,
      sender_role: userRole,
      sender_name: senderDisplayName,
      content: newMessage.trim(),
    };

    setMessages((prev) => [...prev, payload]);
    setNewMessage("");

    try {
      await supabase.from("buddy_messages").insert([payload]);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Toggle Mentor Identity Reveal
  const handleToggleReveal = async () => {
    if (!currentRoom) return;
    const nextState = !revealIdentity;
    setRevealIdentity(nextState);

    try {
      await supabase
        .from("buddy_chat_rooms")
        .update({
          reveal_mentor_identity: nextState,
          mentor_real_name: mentorRealName,
        })
        .eq("id", currentRoom.id);

      setCurrentRoom((prev) => ({
        ...prev,
        reveal_mentor_identity: nextState,
        mentor_real_name: mentorRealName,
      }));
    } catch (err) {
      console.error("Failed to toggle identity:", err);
    }
  };

  // Fresher: Create an Open Buddy Request
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newRequestForm.topic || !newRequestForm.question) {
      alert("Please enter the topic and your doubt.");
      return;
    }

    setIsSubmitting(true);
    const randomFresherId = `Fresher_${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequestPayload = {
      id: `req-${Date.now()}`,
      topic: newRequestForm.topic,
      question: newRequestForm.question,
      category: newRequestForm.category,
      fresher_alias: randomFresherId,
      mentor_alias: null,
      reveal_mentor_identity: false,
      mentor_real_name: null,
      status: "waiting", // Waiting on a senior
    };

    try {
      const { error } = await supabase.from("buddy_chat_rooms").insert([newRequestPayload]);
      if (error) throw error;

      setRooms([newRequestPayload, ...rooms]);
      setCurrentRoom(newRequestPayload);
      setShowNewRequestModal(false);
      setNewRequestForm({ topic: "", question: "", category: "Academics" });
      setUserRole("fresher");
    } catch (err) {
      console.error("Error creating request:", err);
      alert("Failed to submit buddy request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Senior: Accept an Open Doubt Request
  const handleAcceptRequest = async (room) => {
    const randomBuddyAlias = `Senior Buddy #${Math.floor(10 + Math.random() * 90)}`;

    try {
      const { error } = await supabase
        .from("buddy_chat_rooms")
        .update({
          mentor_alias: randomBuddyAlias,
          mentor_real_name: mentorRealName,
          reveal_mentor_identity: false,
          status: "active",
        })
        .eq("id", room.id);

      if (error) throw error;

      const updatedRoom = {
        ...room,
        mentor_alias: randomBuddyAlias,
        mentor_real_name: mentorRealName,
        reveal_mentor_identity: false,
        status: "active",
      };

      setRooms((prev) => prev.map((r) => (r.id === room.id ? updatedRoom : r)));
      setCurrentRoom(updatedRoom);
      setUserRole("mentor");
    } catch (err) {
      console.error("Error accepting request:", err);
      alert("Failed to accept request.");
    }
  };

  // End Current Chat
  const handleEndChat = async () => {
    if (!currentRoom) return;
    if (confirm("End this conversation? Both participants will be unlinked.")) {
      await supabase
        .from("buddy_chat_rooms")
        .update({ status: "ended" })
        .eq("id", currentRoom.id);

      setRooms((prev) => prev.filter((r) => r.id !== currentRoom.id));
      setCurrentRoom(rooms.find((r) => r.id !== currentRoom.id) || null);
      setMessages([]);
    }
  };

  // Filter Searches
  const filteredMentors = mentors.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInternships = internships.filter(
    (i) =>
      i.role_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.skills_required.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Request Mentorship Slot
  const handleRequestSlot = (mentorId) => {
    if (requestedMentors.includes(mentorId)) return;
    const next = [...requestedMentors, mentorId];
    setRequestedMentors(next);
    localStorage.setItem("buddy_mentor_requests", JSON.stringify(next));

    setMentors((prev) =>
      prev.map((m) =>
        m.id === mentorId ? { ...m, slots_available: Math.max(0, m.slots_available - 1) } : m
      )
    );
  };

  // Add Mentor to Cloud
  const handleCreateMentor = async (e) => {
    e.preventDefault();
    if (!mentorForm.name || !mentorForm.domain || !mentorForm.contact_link) {
      alert("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      id: `mentor-${Date.now()}`,
      name: mentorForm.name,
      role: mentorForm.role,
      domain: mentorForm.domain,
      year_branch: mentorForm.year_branch,
      bio: mentorForm.bio || "Passionate about peer guidance and engineering collaboration.",
      contact_link: mentorForm.contact_link,
      slots_available: Number(mentorForm.slots_available),
    };

    try {
      const { error } = await supabase.from("mentors").insert([payload]);
      if (error) throw error;

      setMentors((prev) => [payload, ...prev]);
      setShowMentorModal(false);
      setMentorForm({
        name: "Adarsh N.",
        role: "Peer Guide",
        domain: "MERN Stack & Cloud APIs",
        year_branch: "S4 CSE",
        bio: "",
        contact_link: "",
        slots_available: 3,
      });
    } catch (err) {
      console.error("Mentor add failed:", err);
      alert("Failed to register mentor profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Internship to Cloud
  const handleCreateInternship = async (e) => {
    e.preventDefault();
    if (!internForm.role_title || !internForm.company || !internForm.deadline) {
      alert("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      id: `intern-${Date.now()}`,
      role_title: internForm.role_title,
      company: internForm.company,
      work_mode: internForm.work_mode,
      stipend: internForm.stipend || "Negotiable",
      deadline: internForm.deadline,
      skills_required: internForm.skills_required || "Foundational CS Concepts",
      description: internForm.description || "Exciting early-career opportunity for engineering students.",
      apply_link: internForm.apply_link || "https://linkedin.com",
    };

    try {
      const { error } = await supabase.from("internships").insert([payload]);
      if (error) throw error;

      setInternships((prev) => [payload, ...prev]);
      setShowInternModal(false);
      setInternForm({
        role_title: "",
        company: "",
        work_mode: "Remote",
        stipend: "₹10,000 / month",
        deadline: "",
        skills_required: "",
        description: "",
        apply_link: "",
      });
    } catch (err) {
      console.error("Internship add failed:", err);
      alert("Failed to post internship.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Pin Auth (PIN: 4040)
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

  // Delete Handlers
  const handleDeleteItem = async (type, id) => {
    if (!isAdmin) return;
    if (confirm(`Remove this ${type} listing?`)) {
      if (type === "mentor") {
        setMentors((prev) => prev.filter((m) => m.id !== id));
        await supabase.from("mentors").delete().eq("id", id);
      } else {
        setInternships((prev) => prev.filter((i) => i.id !== id));
        await supabase.from("internships").delete().eq("id", id);
      }
    }
  };

  // Trigger Gemini AI Advice
  const handleGenerateAI = async (item, type) => {
    const key = `${type}-${item.id}`;
    if (aiAdvice[key]) return;

    setLoadingAI((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch("/api/buddyworks/ai-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: type === "mentor" ? item.name : item.role_title,
          context: type === "mentor" ? item.bio : item.description,
          domain: type === "mentor" ? item.domain : item.skills_required,
          type: type,
        }),
      });

      const data = await res.json();
      setAiAdvice((prev) => ({ ...prev, [key]: data.tips }));
    } catch (err) {
      console.error("AI prep failed:", err);
    } finally {
      setLoadingAI((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Separate rooms into open requests vs active chats
  const openRequests = rooms.filter((r) => r.status === "waiting");
  const activeChats = rooms.filter((r) => r.status === "active");

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-indigo-600" /> Buddy Works
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Peer Guidance & Placements
            </span>
            {isAdmin && (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                ADMIN ACTIVE
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Anonymous senior-fresher doubt requests, senior mentors, and verified campus tech internships.
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
            onClick={() => setShowNewRequestModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Request a Buddy
          </button>

          <button
            onClick={() => setShowMentorModal(true)}
            className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" /> Register Mentor
          </button>

          <button
            onClick={() => setShowInternModal(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Post Internship
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "chat"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Doubt Board & Chat
            {openRequests.length > 0 && (
              <span className="bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.2 rounded-full text-[10px]">
                {openRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("mentors")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "mentors"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Verified Mentors ({mentors.length})
          </button>

          <button
            onClick={() => setActiveTab("internships")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "internships"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Internships ({internships.length})
          </button>
        </div>

        {activeTab !== "chat" && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={activeTab === "mentors" ? "Search domain or mentor..." : "Search role or skill..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* VIEW 1: REQUEST BOARD & 1-ON-1 CHAT */}
      {activeTab === "chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Open Requests Board & Active Sessions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Identity & Persona Widget */}
            <div className="border border-gray-200 rounded-2xl bg-white p-4 space-y-3 shadow-sm">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Your Role in Chat
              </span>
              <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setUserRole("fresher")}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    userRole === "fresher" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600"
                  }`}
                >
                  Fresher
                </button>
                <button
                  onClick={() => setUserRole("mentor")}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    userRole === "mentor" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600"
                  }`}
                >
                  Senior Buddy
                </button>
              </div>

              {userRole === "mentor" && currentRoom && currentRoom.status === "active" && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-950">Reveal Identity:</span>
                    <button
                      onClick={handleToggleReveal}
                      className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition-all ${
                        revealIdentity ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {revealIdentity ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {revealIdentity ? "Revealed" : "Masked"}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {revealIdentity ? `Showing: ${mentorRealName}` : "Showing: Senior Buddy #ID"}
                  </p>
                </div>
              )}
            </div>

            {/* Open Doubt Requests (Waiting for a Senior) */}
            <div className="border border-gray-200 rounded-2xl bg-white p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Inbox className="w-3.5 h-3.5 text-amber-500" /> Open Requests ({openRequests.length})
                </span>
                <button
                  onClick={() => setShowNewRequestModal(true)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Post
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {openRequests.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">No pending requests right now.</p>
                ) : (
                  openRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2"
                    >
                      <div>
                        <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                          {req.category || "General"}
                        </span>
                        <h5 className="font-semibold text-xs text-gray-900 mt-1 leading-snug">
                          {req.topic}
                        </h5>
                        <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">
                          {req.question}
                        </p>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <span className="text-gray-400 text-[10px]">{req.fresher_alias}</span>
                        <button
                          onClick={() => handleAcceptRequest(req)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                        >
                          Accept & Guide <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Guided Sessions */}
            <div className="border border-gray-200 rounded-2xl bg-white p-4 space-y-3 shadow-sm">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Active Buddy Chats ({activeChats.length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {activeChats.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setCurrentRoom(r)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border ${
                      currentRoom?.id === r.id
                        ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold"
                        : "bg-white border-gray-100 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="truncate font-medium">{r.topic}</div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                      <span>{r.fresher_alias}</span>
                      <span className="text-indigo-600 font-semibold">{r.mentor_alias}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Active Conversation Stream */}
          <div className="lg:col-span-3 border border-gray-200 rounded-2xl bg-white shadow-sm flex flex-col h-[580px] overflow-hidden">
            {/* Room Header */}
            <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-gray-900">
                    {currentRoom ? currentRoom.topic : "Select or Accept a Buddy Request"}
                  </h4>
                  {currentRoom?.status === "active" ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Senior Assigned
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Waiting for a Buddy
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-0.5">
                  Fresher: <strong className="text-gray-700">{currentRoom?.fresher_alias || "Anonymous"}</strong> | Senior:{" "}
                  <strong className="text-indigo-600">
                    {currentRoom?.status === "waiting"
                      ? "Unassigned"
                      : currentRoom?.reveal_mentor_identity
                      ? currentRoom?.mentor_real_name
                      : currentRoom?.mentor_alias}
                  </strong>
                </p>
              </div>

              {currentRoom && (
                <button
                  onClick={handleEndChat}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded-lg border border-rose-200 bg-white"
                >
                  Unpair / End
                </button>
              )}
            </div>

            {/* Doubt Context Header Banner if available */}
            {currentRoom?.question && (
              <div className="bg-amber-50/70 border-b border-amber-100 px-4 py-2.5 text-xs text-gray-700 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900">Original Doubt:</span> {currentRoom.question}
                </div>
              </div>
            )}

            {/* Message Stream */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40"
            >
              {currentRoom?.status === "waiting" ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-2">
                  <Clock className="w-8 h-8 text-amber-500 animate-pulse" />
                  <p className="text-xs font-semibold text-gray-700">
                    Your request is live on the board!
                  </p>
                  <p className="text-[11px] text-gray-500 max-w-sm">
                    Seniors and classmates can view this on their board. As soon as someone accepts, you can chat anonymously here.
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-2">
                  <MessageSquare className="w-8 h-8 text-indigo-400" />
                  <p className="text-xs">
                    Senior buddy joined! Feel free to ask questions about exams, labs, records, or campus life.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe =
                    (userRole === "fresher" && msg.sender_role === "fresher") ||
                    (userRole === "mentor" && msg.sender_role === "mentor");

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] text-gray-400 mb-0.5 px-1 font-medium">
                        {msg.sender_name}
                      </span>
                      <div
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-br-xs"
                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-xs"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-gray-200 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                disabled={!currentRoom || currentRoom.status === "waiting"}
                placeholder={
                  !currentRoom || currentRoom.status === "waiting"
                    ? "Waiting for a senior buddy to accept..."
                    : userRole === "fresher"
                    ? "Ask your doubt to your senior buddy..."
                    : "Guide the fresher with genuine campus advice..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim() || currentRoom?.status === "waiting"}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 2: MENTORS */}
      {activeTab === "mentors" && (
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm">Connecting to mentors list...</p>
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
              <p className="text-sm text-gray-500 font-medium">No mentors match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMentors.map((m) => {
                const isRequested = requestedMentors.includes(m.id);
                const adviceKey = `mentor-${m.id}`;
                const hasAdvice = aiAdvice[adviceKey];
                const isAILoading = loadingAI[adviceKey];

                return (
                  <div
                    key={m.id}
                    className="border border-gray-200 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold px-2.5 py-1 rounded-md">
                          {m.role}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {m.year_branch}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteItem("mentor", m.id)}
                              className="text-gray-400 hover:text-rose-600 p-1"
                              title="Delete Mentor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 text-base leading-snug">
                          {m.name}
                        </h4>
                        <p className="text-xs text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
                          <Award className="w-3 h-3 text-indigo-600" /> {m.domain}
                        </p>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                        {m.bio}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                        <span>Slots: <strong className="text-gray-800">{m.slots_available} available</strong></span>
                        {isRequested && (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Requested
                          </span>
                        )}
                      </div>

                      {hasAdvice && (
                        <div className="mt-3 bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-950">
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            Mentor Match Strategy:
                          </div>
                          {hasAdvice.map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-xs text-indigo-950">
                              <span className="text-indigo-600 mt-0.5">•</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleGenerateAI(m, "mentor")}
                        disabled={isAILoading}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Sparkles className={`w-3 h-3 ${isAILoading ? "animate-spin" : ""}`} />
                        {isAILoading ? "Loading..." : hasAdvice ? "Advice Ready ✓" : "AI Match Prep"}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRequestSlot(m.id)}
                          disabled={isRequested || m.slots_available <= 0}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                            isRequested
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : m.slots_available <= 0
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                          }`}
                        >
                          {isRequested ? "Booked" : m.slots_available <= 0 ? "Full" : "Request Slot"}
                        </button>

                        <a
                          href={m.contact_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          title="Contact Mentor"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: INTERNSHIPS */}
      {activeTab === "internships" && (
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm">Connecting to verified internships...</p>
            </div>
          ) : filteredInternships.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
              <p className="text-sm text-gray-500 font-medium">No internships match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredInternships.map((intern) => {
                const adviceKey = `internship-${intern.id}`;
                const hasAdvice = aiAdvice[adviceKey];
                const isAILoading = loadingAI[adviceKey];

                return (
                  <div
                    key={intern.id}
                    className="border border-gray-200 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {intern.stipend}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {intern.work_mode}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteItem("internship", intern.id)}
                              className="text-gray-400 hover:text-rose-600 p-1"
                              title="Delete Internship"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 text-base leading-snug">
                          {intern.role_title}
                        </h4>
                        <p className="text-xs text-indigo-600 font-medium mt-0.5">
                          {intern.company}
                        </p>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                        {intern.description}
                      </p>

                      <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span className="truncate"><strong>Skills:</strong> {intern.skills_required}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Deadline: {new Date(intern.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>

                      {hasAdvice && (
                        <div className="mt-3 bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-950">
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            AI Resume & Interview Edge:
                          </div>
                          {hasAdvice.map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-xs text-indigo-950">
                              <span className="text-indigo-600 mt-0.5">•</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleGenerateAI(intern, "internship")}
                        disabled={isAILoading}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Sparkles className={`w-3 h-3 ${isAILoading ? "animate-spin" : ""}`} />
                        {isAILoading ? "Analyzing..." : hasAdvice ? "Prep Ready ✓" : "AI Role Prep"}
                      </button>

                      <a
                        href={intern.apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 active:scale-95 transition-all shadow-sm"
                      >
                        Apply <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: POST NEW BUDDY REQUEST */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden text-gray-900">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" /> Post a Doubt to Buddy Board
              </h3>
              <button onClick={() => setShowNewRequestModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Doubt Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab viva procedures & fair record marks"
                  value={newRequestForm.topic}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={newRequestForm.category}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Academics">Academics & KTU Exams</option>
                  <option value="Lab & Records">Lab & Records</option>
                  <option value="Hostel Life">Hostel Life & Campus</option>
                  <option value="Tech & Clubs">Tech Clubs & Hackathons</option>
                  <option value="Placements">Internships & Placements</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Describe Your Doubt *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Explain what you need guidance with. A senior who has navigated this will accept and chat with you..."
                  value={newRequestForm.question}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, question: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <span>You will be given an anonymous moniker (e.g. Fresher_404). Your real student profile is completely hidden.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? "Posting..." : "Post Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER MENTOR */}
      {showMentorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden text-gray-900">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> Register as a Mentor
              </h3>
              <button onClick={() => setShowMentorModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMentor} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={mentorForm.name}
                  onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mentor Type</label>
                  <select
                    value={mentorForm.role}
                    onChange={(e) => setMentorForm({ ...mentorForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Senior Mentor">Senior Mentor</option>
                    <option value="Peer Guide">Peer Guide</option>
                    <option value="Domain Mentor">Domain Mentor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Batch / Class</label>
                  <input
                    type="text"
                    required
                    value={mentorForm.year_branch}
                    onChange={(e) => setMentorForm({ ...mentorForm, year_branch: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Domain of Expertise *</label>
                <input
                  type="text"
                  required
                  value={mentorForm.domain}
                  onChange={(e) => setMentorForm({ ...mentorForm, domain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Link (LinkedIn / Email / WhatsApp) *</label>
                <input
                  type="text"
                  required
                  placeholder="mailto:... or https://linkedin.com/in/..."
                  value={mentorForm.contact_link}
                  onChange={(e) => setMentorForm({ ...mentorForm, contact_link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bio / Mentoring Style</label>
                <textarea
                  rows="2"
                  value={mentorForm.bio}
                  onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowMentorModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? "Publishing..." : "Publish Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POST INTERNSHIP */}
      {showInternModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden text-gray-900">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" /> Post Internship
              </h3>
              <button onClick={() => setShowInternModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInternship} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Internship Title *</label>
                <input
                  type="text"
                  required
                  value={internForm.role_title}
                  onChange={(e) => setInternForm({ ...internForm, role_title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Startup *</label>
                  <input
                    type="text"
                    required
                    value={internForm.company}
                    onChange={(e) => setInternForm({ ...internForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Work Mode</label>
                  <select
                    value={internForm.work_mode}
                    onChange={(e) => setInternForm({ ...internForm, work_mode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stipend</label>
                  <input
                    type="text"
                    value={internForm.stipend}
                    onChange={(e) => setInternForm({ ...internForm, stipend: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Application Deadline *</label>
                  <input
                    type="date"
                    required
                    value={internForm.deadline}
                    onChange={(e) => setInternForm({ ...internForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Key Skills Required *</label>
                <input
                  type="text"
                  required
                  value={internForm.skills_required}
                  onChange={(e) => setInternForm({ ...internForm, skills_required: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Application URL</label>
                <input
                  type="url"
                  value={internForm.apply_link}
                  onChange={(e) => setInternForm({ ...internForm, apply_link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Job Overview</label>
                <textarea
                  rows="2"
                  value={internForm.description}
                  onChange={(e) => setInternForm({ ...internForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowInternModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? "Posting..." : "Post Internship"}
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