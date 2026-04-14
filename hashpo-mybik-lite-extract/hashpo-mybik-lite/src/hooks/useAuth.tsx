import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  kycVerified: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  kycVerified: false,
  isAdmin: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [kycVerified, setKycVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadingFailSafe = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    const fetchUserMeta = async (userId: string) => {
      try {
        const [profileRes, rolesRes] = await Promise.all([
          supabase.from("profiles").select("kyc_verified").eq("user_id", userId).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", userId),
        ]);
        if (!mounted) return;
        setKycVerified(profileRes.data?.kyc_verified ?? false);
        setIsAdmin(rolesRes.data?.some((r) => r.role === "admin") ?? false);
      } catch (e) {
        console.error("Auth metadata fetch failed:", e);
      } finally {
        // Never keep auth loading indefinitely due to metadata/network issues.
        if (mounted) setLoading(false);
      }
    };

    // 1️⃣ Get initial session synchronously
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchUserMeta(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2️⃣ Listen for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setLoading(true);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          void fetchUserMeta(session.user.id);
        } else {
          setKycVerified(false);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(loadingFailSafe);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, kycVerified, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
