"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (sessionUser) => {
    if (!sessionUser) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else {
        // Fallback default profile if not in table yet
        const defaultProfile = {
          id: sessionUser.id,
          email: sessionUser.email || "student@vjcet.org",
          full_name:
            sessionUser.user_metadata?.full_name ||
            sessionUser.email?.split("@")[0] ||
            "Student",
          student_id: sessionUser.user_metadata?.student_id || "23CS371",
          semester: "S4",
          branch: "CSE",
        };
        // Fire and forget upsert so it never blocks the UI
        supabase.from("profiles").upsert([defaultProfile]).catch(() => {});
        setProfile(defaultProfile);
      }
    } catch (err) {
      console.warn("Profile fetch skipped, using session metadata:", err);
      setProfile({
        id: sessionUser.id,
        email: sessionUser.email,
        full_name: sessionUser.user_metadata?.full_name || "Student",
        student_id: sessionUser.user_metadata?.student_id || "23CS371",
        semester: "S4",
        branch: "CSE",
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety timeout: If Supabase takes > 2.5s, force loading to false so the UI unlocks
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2500);

    const initAuth = async () => {
      try {
        // Check if a demo user was active
        const savedDemo = localStorage.getItem("buddy_demo_user");
        if (savedDemo) {
          const parsed = JSON.parse(savedDemo);
          if (mounted) {
            setUser(parsed);
            setProfile({
              id: parsed.id,
              email: parsed.email,
              full_name: parsed.user_metadata?.full_name || "Adarsh Naijo",
              student_id: parsed.user_metadata?.student_id || "23CS371",
              semester: "S4",
              branch: "Computer Science and Engineering",
            });
            setLoading(false);
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user || null;

        if (mounted) {
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile(currentUser);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) {
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;
        if (mounted) {
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile(currentUser);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    localStorage.removeItem("buddy_demo_user");
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email, password, fullName, studentId) => {
    localStorage.removeItem("buddy_demo_user");
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          student_id: studentId,
        },
      },
    });

    if (res.data?.user) {
      const newProf = {
        id: res.data.user.id,
        email,
        full_name: fullName,
        student_id: studentId,
        semester: "S4",
        branch: "CSE",
      };
      await supabase.from("profiles").upsert([newProf]).catch(() => {});
      setProfile(newProf);
      setUser(res.data.user);
    }
    return res;
  };

  const signOut = async () => {
    localStorage.removeItem("buddy_demo_user");
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    setProfile(null);
  };

  const demoLogin = (asName = "Adarsh Naijo", asId = "23CS371") => {
    const mockUser = {
      id: "demo-user-101",
      email: "adarsh@vjcet.org",
      user_metadata: { full_name: asName, student_id: asId },
    };
    const mockProfile = {
      id: "demo-user-101",
      email: "adarsh@vjcet.org",
      full_name: asName,
      student_id: asId,
      semester: "S4",
      branch: "Computer Science and Engineering",
    };
    localStorage.setItem("buddy_demo_user", JSON.stringify(mockUser));
    setUser(mockUser);
    setProfile(mockProfile);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, demoLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
