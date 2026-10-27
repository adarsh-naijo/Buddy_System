"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Sparkles, 
  Search, 
  Users, 
  Plus, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Trash2, 
  Loader2, 
  Image as ImageIcon, 
  CheckCircle2, 
  Trophy, 
  Tag, 
  Check,
  BookmarkCheck
} from "lucide-react";

const DEFAULT_FALLBACK_EVENTS = [
  {
    id: "event-1",
    title: "The Missing Piece: Solution Hackathon",
    category: "Hackathon",
    organizer: "UNAI × μLearn Chapter",
    event_date: "2026-10-27",
    event_time: "09:00 AM - 05:00 PM",
    venue: "Decennial Hall & CSE Labs",
    poster_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
    description: "Flagship 8-hour sprint building tech-driven student support systems and campus utility applications.",
    registration_link: "https://mulearn.org",
    attendees_count: 42
  },
  {
    id: "event-2",
    title: "Agentic AI & LLM Systems Hands-on",
    category: "Workshop",
    organizer: "FOSS Cell & FutureSkills",
    event_date: "2026-11-04",
    event_time: "01:30 PM - 04:30 PM",
    venue: "Software Systems Lab 3",
    poster_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    description: "Deep dive into LangChain, Gemini API agents, function calling, and vector database embeddings.",
    registration_link: "https://vjcet.ac.in",
    attendees_count: 28
  },
  {
    id: "event-3",
    title: "RoboKinesis: Embedded IoT & ESP32 Challenge",
    category: "Workshop",
    organizer: "Robotics & Automation Club",
    event_date: "2026-11-12",
    event_time: "10:00 AM - 03:30 PM",
    venue: "FabLab Workshop",
    poster_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    description: "Hardware prototyping with microcontrollers, real-time telemetry over MQTT, and cloud dashboard integrations.",
    registration_link: "https://vjcet.ac.in",
    attendees_count: 19
  }
];

export default function EventHub() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState([]);
  const [userRsvps, setUserRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [onlyMyRsvps, setOnlyMyRsvps] = useState(false);

  // Admin Controls
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);

  // AI Cache
  const [aiStrategies, setAiStrategies] = useState({});
  const [loadingAI, setLoadingAI] = useState({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Hackathon",
    organizer: "",
    event_date: "",
    event_time: "",
    venue: "",
    description: "",
    registration_link: "",
  });
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);

  const currentUserId = user?.id || "demo-user-101";
  const currentUserEmail = user?.email || "student@vjcet.org";
  const categories = ["All", "Hackathon", "Workshop", "Cultural", "Club Activity", "Seminar"];

  const fetchEventsAndRSVPs = async () => {
    try {
      setLoading(true);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Event fetch timeout")), 2000)
      );

      const queryPromise = Promise.all([
        supabase.from("events").select("*").order("event_date", { ascending: true }),
        supabase.from("event_rsvps").select("event_id").eq("user_id", currentUserId)
      ]);

      const [eventsRes, rsvpsRes] = await Promise.race([queryPromise, timeoutPromise]);

      if (eventsRes.data && eventsRes.data.length > 0) {
        setEvents(eventsRes.data);
      } else {
        setEvents(DEFAULT_FALLBACK_EVENTS);
      }

      if (rsvpsRes.data) {
        setUserRsvps(rsvpsRes.data.map((r) => r.event_id));
      }
    } catch (err) {
      console.warn("Using fallback events due to timeout/error:", err);
      setEvents(DEFAULT_FALLBACK_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndRSVPs();
  }, [currentUserId]);

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory === "All" || ev.category === selectedCategory;
    const matchesMyRsvps = !onlyMyRsvps || userRsvps.includes(ev.id);

    return matchesSearch && matchesCat && matchesMyRsvps;
  });

  const handleToggleRSVP = async (event) => {
    const isAttending = userRsvps.includes(event.id);
    const updatedRSVPs = isAttending
      ? userRsvps.filter((id) => id !== event.id)
      : [...userRsvps, event.id];

    setUserRsvps(updatedRSVPs);

    const newCount = (event.attendees_count || 0) + (isAttending ? -1 : 1);

    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, attendees_count: newCount } : e))
    );

    try {
      if (isAttending) {
        await supabase
          .from("event_rsvps")
          .delete()
          .match({ event_id: event.id, user_id: currentUserId });
      } else {
        await supabase.from("event_rsvps").insert([
          {
            id: `rsvp-${Date.now()}`,
            event_id: event.id,
            user_id: currentUserId,
            user_email: currentUserEmail,
          },
        ]);
      }

      await supabase
        .from("events")
        .update({ attendees_count: newCount })
        .eq("id", event.id);
    } catch (err) {
      console.error("RSVP sync failed:", err);
    }
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedPoster(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPosterPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.organizer || !formData.event_date || !formData.venue) {
      alert("Please fill all required fields.");
      return;
    }

    setIsSubmitting(true);
    const newEvent = {
      id: `event-${Date.now()}`,
      title: formData.title,
      category: formData.category,
      organizer: formData.organizer,
      event_date: formData.event_date,
      event_time: formData.event_time || "TBA",
      venue: formData.venue,
      poster_url: posterPreview || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
      description: formData.description || "Join this campus event to learn, network, and collaborate.",
      registration_link: formData.registration_link || "https://vjcet.ac.in",
      attendees_count: 1,
    };

    try {
      const { error } = await supabase.from("events").insert([newEvent]);
      if (error) console.warn("Supabase event insert error:", error);

      setEvents((prev) => [...prev, newEvent]);
      setIsModalOpen(false);
      setSelectedPoster(null);
      setPosterPreview(null);
      setFormData({
        title: "",
        category: "Hackathon",
        organizer: "",
        event_date: "",
        event_time: "",
        venue: "",
        description: "",
        registration_link: "",
      });
    } catch (err) {
      console.error("Event insert error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!isAdmin) {
      alert("Admin authorization required to delete events.");
      return;
    }

    if (confirm(`Delete "${event.title}" from campus listings?`)) {
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      try {
        await supabase.from("events").delete().eq("id", event.id);
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

  const handleGenerateAIStrategy = async (event) => {
    if (aiStrategies[event.id]) return;

    setLoadingAI((prev) => ({ ...prev, [event.id]: true }));

    try {
      const res = await fetch("/api/events/ai-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: event.title,
          category: event.category,
          description: event.description,
          organizer: event.organizer,
        }),
      });

      const data = await res.json();
      setAiStrategies((prev) => ({ ...prev, [event.id]: data.strategies }));
    } catch (err) {
      console.error("AI prep strategy failed:", err);
    } finally {
      setLoadingAI((prev) => ({ ...prev, [event.id]: false }));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-indigo-600" /> Event Hub
            </h2>
            {isAdmin && (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> ADMIN ACTIVE
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Discover upcoming hackathons, workshops, and manage your personal event calendar.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setOnlyMyRsvps(!onlyMyRsvps)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              onlyMyRsvps
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            {onlyMyRsvps ? `Attending (${userRsvps.length})` : "My Events"}
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
            <Plus className="w-4 h-4" /> Post Event
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by event title, organizer, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "All" ? "All Categories" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Events Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm">Connecting to event hub...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
          <Calendar className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-700">No events found.</p>
          <p className="text-xs text-gray-500">
            {onlyMyRsvps ? "You haven't RSVP'd to any events yet." : "Try adjusting your search criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const hasStrategy = aiStrategies[event.id];
            const isAILoading = loadingAI[event.id];
            const isAttending = userRsvps.includes(event.id);

            return (
              <div
                key={event.id}
                className="border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="w-full h-44 bg-gray-100 relative overflow-hidden">
                    <img
                      src={event.poster_url}
                      alt={event.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-indigo-600/90 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm">
                        {event.category}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteEvent(event)}
                        className="absolute top-3 right-3 bg-white/90 hover:bg-rose-50 text-rose-600 p-1.5 rounded-md shadow-sm transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium text-indigo-600 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {event.organizer}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        <Users className="w-3 h-3 text-gray-500" />
                        {event.attendees_count || 0} attending
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-base leading-snug">
                      {event.title}
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        <span className="text-gray-300">•</span>
                        <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{event.event_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>

                    {hasStrategy && (
                      <div className="mt-3 bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                          <Trophy className="w-3.5 h-3.5 text-indigo-600" />
                          AI Prep & Winning Edge:
                        </div>
                        <ul className="space-y-1.5">
                          {hasStrategy.map((pt, idx) => (
                            <li key={idx} className="text-xs text-indigo-950 flex items-start gap-1.5 leading-relaxed">
                              <CheckCircle2 className="w-3 h-3 text-indigo-600 mt-0.5 shrink-0" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleGenerateAIStrategy(event)}
                    disabled={isAILoading}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Sparkles className={`w-3 h-3 ${isAILoading ? "animate-spin" : ""}`} />
                    {isAILoading ? "Analyzing..." : hasStrategy ? "Prep Ready ✓" : "AI Pitch Strategy"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleRSVP(event)}
                      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all active:scale-95 ${
                        isAttending
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {isAttending ? <Check className="w-3.5 h-3.5" /> : null}
                      {isAttending ? "RSVP'd ✓" : "RSVP"}
                    </button>

                    {event.registration_link && (
                      <a
                        href={event.registration_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 shadow-sm active:scale-95 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Apply
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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

      {/* Post Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden text-gray-900">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> Post Campus Event
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Level Ideathon 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Club Activity">Club Activity</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Club / Organizer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IEEE VJCET SB"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Time Range</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:30 AM - 04:00 PM"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Venue / Room *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auditorium / Project Lab 2"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Registration or Info Link</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.registration_link}
                  onChange={(e) => setFormData({ ...formData, registration_link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Event Poster (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-3 text-center cursor-pointer relative bg-gray-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {selectedPoster ? (
                    <div className="text-indigo-700 text-xs font-medium truncate">
                      {selectedPoster.name}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <span>Upload Banner / Poster Image</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description & Rules</label>
                <textarea
                  rows="2"
                  placeholder="Summarize the event guidelines, prize pool, or eligibility..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? "Publishing..." : "Publish Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}