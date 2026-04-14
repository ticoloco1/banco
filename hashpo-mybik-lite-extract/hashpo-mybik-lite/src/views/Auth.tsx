"use client";

import { useState, useEffect } from "react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  // Após retorno do Google OAuth, Supabase coloca a sessão na URL; ao carregar, redireciona se já logado
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        toast.success("Login realizado!");
        router.replace(redirectTo);
      }
    });
  }, [router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        router.push(redirectTo);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to confirm your account.");
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const callbackPath = `/auth${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`;
    const oauthRedirectTo = typeof window !== "undefined" ? `${window.location.origin}${callbackPath}` : callbackPath;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: oauthRedirectTo,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      toast.error(error.message || "Login com Google falhou");
      return;
    }
    toast.success("Redirecionando para Google...");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <SEO title="Sign In" description="Sign in or create your HASHPO account to trade creator content shares and earn dividends." noIndex />
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            <span className="text-2xl font-extrabold font-mono text-primary">HASHPO</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Premium Video Exchange
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          {/* Entrada oficial: Google em destaque — sem cadastro, puxa dados do usuário (bom para lead) */}
          <p className="text-center text-xs text-muted-foreground mb-1">
            Entrada rápida — sem cadastro. Usamos os dados da sua conta Google.
          </p>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-bold text-sm py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 border-2 border-foreground"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>

          <div className="relative my-4">
            <span className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </span>
            <span className="relative flex justify-center text-[10px] uppercase text-muted-foreground font-bold">ou com e-mail</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-sm font-bold text-card-foreground uppercase text-center">
            {isLogin ? "Entrar com e-mail" : "Criar conta com e-mail"}
          </h2>

          {!isLogin && (
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-secondary text-foreground text-sm border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            minLength={6}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold text-sm py-2.5 rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : isLogin ? "Entrar" : "Criar conta"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            {isLogin ? "Sem conta?" : "Já tem conta?"}{" "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </p>
          </form>
        </div>

        <p className="text-[7px] text-muted-foreground/60 text-center leading-tight">
          HASHPO IS A TECH PLATFORM. CONTENT IS CREATOR RESPONSIBILITY. HIGH RISK ASSET.
        </p>
      </div>
    </div>
  );
};

export default Auth;
