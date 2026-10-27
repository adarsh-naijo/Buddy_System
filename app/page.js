"use client";

import React, { useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import NoteIt from "@/components/NoteIt";
import EventHub from "@/components/EventHub";
import TimetablePlanner from "@/components/TimetablePlanner";
import BuddyWorks from "@/components/BuddyWorks";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Users, 
  Sparkles, 
  LogOut, 
  User, 
  IdCard, 
  GraduationCap, 
  X,
  ChevronDown,
  Layers
} from "lucide-react";

function MainApp() {
  const { user, profile, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("notes");
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // If still checking session on first load
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white space-y-3">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-indigo-200 font-medium">Loading student account...</p>
        </div>
      </div>
    );
  }

  // If not logged in, enforce authentication screen
  if (!user) {
    return <AuthModal />;
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || "Adarsh Naijo";
  const displayId = profile?.student_id || user.user_metadata?.student_id || "23CS371";
  const displaySem = profile?.semester || "S4";
  const displayBranch = profile?.branch || "CSE";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Application Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl font-bold flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg text-slate-900 leading-tight">Buddy System</h1>
              <p className="text-[10px] text-indigo-600 font-bold tracking-wide uppercase">UNAI × μLearn Hackathon Edition</p>
            </div>
          </div>

          {/* Module Selector Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "notes"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Note It
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "events"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Event Hub
            </button>
            <button
              onClick={() => setActiveTab("timetable")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "timetable"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Timetable & Exam
            </button>
            <button
              onClick={() => setActiveTab("buddyworks")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "buddyworks"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Buddy Works
            </button>
          </nav>

          {/* User Account Navigation Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfileDrawer(true)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-xs font-semibold text-slate-800"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                {displayName.charAt(0)}
              </div>
              <span className="hidden sm:inline truncate max-w-[110px]">{displayName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center gap-1 p-2 bg-slate-100 border-t border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === "notes" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === "events" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab("timetable")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === "timetable" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            Timetable
          </button>
          <button
            onClick={() => setActiveTab("buddyworks")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === "buddyworks" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            Buddy Works
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <section className="py-6">
        {activeTab === "notes" && <NoteIt />}
        {activeTab === "events" && <EventHub />}
        {activeTab === "timetable" && <TimetablePlanner />}
        {activeTab === "buddyworks" && <BuddyWorks />}
      </section>

      {/* Slide-out "My Space" Profile Drawer */}
      {showProfileDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-sm h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" /> Student Profile
                </h3>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Identity Card */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 space-y-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-lg border border-white/20">
                    {displayName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-base leading-tight">{displayName}</h4>
                    <p className="text-xs text-indigo-200 mt-0.5">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[10px] text-indigo-300 uppercase block font-semibold">Student ID</span>
                    <span className="font-bold text-white">{displayId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-300 uppercase block font-semibold">Semester & Class</span>
                    <span className="font-bold text-white">{displaySem} {displayBranch}</span>
                  </div>
                </div>
              </div>

              {/* Quick Summary Highlights */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Connected Features
                </span>
                <div className="border border-slate-200 rounded-xl p-3 space-y-2 text-xs text-slate-600 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span>Note Uploads Author:</span>
                    <strong className="text-slate-900">{displayName}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Exam Target Class:</span>
                    <strong className="text-slate-900">{displaySem} {displayBranch}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Doubts Persona:</span>
                    <span className="text-emerald-600 font-bold">Masked / Anonymous</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowProfileDrawer(false);
                  signOut();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out of Buddy System
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}