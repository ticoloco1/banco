import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Mic, MicOff, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  /** Mini site ID ou "main" para o site principal. Null/undefined = site principal. */
  siteId?: string | null;
  siteName?: string;
  siteContext?: string;
  accentColor?: string;
  /** Modo agenda: advogados, médicos, professores. IA explica e visitante pode solicitar agendamento. */
  agendaEnabled?: boolean;
  /** Preço em USD para confirmar agendamento (cobrança no site, 10% comissão). */
  appointmentPrice?: number;
}

const getSupabaseUrl = () => (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) || (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) || "";
const getSupabaseKey = () => (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || (typeof process !== "undefined" && process.env?.VITE_SUPABASE_PUBLISHABLE_KEY) || (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY) || "";
const CHAT_URL = `${getSupabaseUrl()}/functions/v1/ai-chat`;

const AiChatWidget = ({ siteId = null, siteName, siteContext, accentColor = "#a855f7", agendaEnabled = false, appointmentPrice = 0 }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [listening, setListening] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [agendaName, setAgendaName] = useState("");
  const [agendaEmail, setAgendaEmail] = useState("");
  const [agendaWhen, setAgendaWhen] = useState("");
  const [agendaMessage, setAgendaMessage] = useState("");
  const [agendaSubmitting, setAgendaSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    if (!user) { toast.error("Faça login para usar o assistente IA"); return; }

    const userMsg: Msg = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getSupabaseKey()}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          site_id: siteId || null,
          site_context: siteContext || siteName || "",
          agenda_enabled: agendaEnabled,
        }),
      });

      if (resp.status === 402) {
        const data = await resp.json();
        setLimitReached(true);
        toast.error(data.message || "Limite de interações atingido. Compre mais abaixo.");
        setLoading(false);
        return;
      }
      setLimitReached(false);
      if (resp.status === 429) {
        toast.error("Muitas requisições. Tente novamente em alguns segundos.");
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      let done = false;
      while (!done) {
        const { done: rd, value } = await reader.read();
        if (rd) break;
        buf += decoder.decode(value, { stream: true });
        let ni: number;
        while ((ni = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, ni);
          buf = buf.slice(ni + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error("Erro ao conectar com IA");
    }
    setLoading(false);
  };

  const startVoice = () => {
    if (listening) {
      try { (window as any).SpeechRecognition?.stop?.() || (window as any).webkitSpeechRecognition?.stop?.(); } catch {}
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Seu navegador não suporta reconhecimento de voz."); return; }
    const rec = new SpeechRecognition();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[e.results.length - 1];
      const text = t[0]?.transcript;
      if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
      setListening(false);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); toast.error("Erro ao ouvir. Tente de novo."); };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const submitAgenda = async () => {
    if (!user || !siteId) return;
    const email = (agendaEmail || user.email || "").trim();
    if (!email) { toast.error("Informe seu e-mail."); return; }
    setAgendaSubmitting(true);
    try {
      const { error } = await supabase.from("appointment_requests").insert({
        site_id: siteId,
        user_id: user.id,
        guest_name: (agendaName || user.user_metadata?.full_name || "").trim() || null,
        guest_email: email,
        preferred_datetime: agendaWhen.trim() || null,
        message: agendaMessage.trim() || null,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Solicitação enviada! O profissional confirmará por e-mail.");
      setAgendaOpen(false);
      setAgendaName(""); setAgendaEmail(""); setAgendaWhen(""); setAgendaMessage("");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao enviar solicitação.");
    } finally {
      setAgendaSubmitting(false);
    }
  };

  return (
    <>
      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110"
        style={{ backgroundColor: accentColor }}
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-80 sm:w-96 h-[28rem] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2 border-b border-border" style={{ backgroundColor: accentColor + "15" }}>
            <Bot className="w-5 h-5" style={{ color: accentColor }} />
            <div>
              <p className="text-sm font-bold text-foreground">Assistente IA</p>
              <p className="text-[10px] text-muted-foreground">{siteName || "Mini Site"} • 1.000 grátis; depois $5/1.000 ou $50/10.000</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <Bot className="w-10 h-10 mx-auto text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Olá! Como posso ajudar?</p>
                <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                  {["Quais serviços?", "Agendar consulta", "Contato"].map(q => (
                    <button key={q} onClick={() => { setInput(q); }} className="text-[10px] px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && <Bot className="w-5 h-5 mt-1 shrink-0" style={{ color: accentColor }} />}
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  {m.content}
                </div>
                {m.role === "user" && <User className="w-5 h-5 mt-1 shrink-0 text-muted-foreground" />}
              </div>
            ))}
            {loading && !messages.find(m => m.role === "assistant" && m === messages[messages.length - 1]) && (
              <div className="flex gap-2">
                <Bot className="w-5 h-5 mt-1" style={{ color: accentColor }} />
                <div className="bg-muted rounded-xl px-3 py-2 text-xs text-muted-foreground animate-pulse">Pensando...</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            {limitReached && (
              <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                <p className="text-[10px] font-medium text-foreground">Limite atingido. Compre mais interações:</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">$5 = 1.000 · $50 = 10.000 (cobrança na hora)</p>
                <a href="/comprar-ia" className="text-[10px] font-bold mt-1 inline-block underline" style={{ color: accentColor }}>Comprar interações ($5 ou $50)</a>
              </div>
            )}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={startVoice}
                title={listening ? "Parar gravação" : "Falar"}
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${listening ? "bg-red-500/20 text-red-600" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder={user ? "Digite ou fale..." : "Faça login para usar"}
                disabled={!user || loading}
                className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading || !user}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ backgroundColor: accentColor, color: "white" }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1 text-center">$5 = 1.000 interações · $50 = 10.000 (cobrança na hora)</p>

            {agendaEnabled && (
              <div className="mt-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAgendaOpen(!agendaOpen)}
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                >
                  <Calendar className="w-3.5 h-3.5" /> {agendaOpen ? "Ocultar" : "Solicitar agendamento"}
                </button>
                {agendaOpen && (
                  <div className="mt-2 space-y-1.5">
                    <input type="text" value={agendaName} onChange={e => setAgendaName(e.target.value)} placeholder="Seu nome" className="w-full bg-muted rounded px-2 py-1.5 text-[10px]" />
                    <input type="email" value={agendaEmail} onChange={e => setAgendaEmail(e.target.value)} placeholder="E-mail para confirmação *" className="w-full bg-muted rounded px-2 py-1.5 text-[10px]" />
                    <input type="text" value={agendaWhen} onChange={e => setAgendaWhen(e.target.value)} placeholder="Data/hora preferida" className="w-full bg-muted rounded px-2 py-1.5 text-[10px]" />
                    <textarea value={agendaMessage} onChange={e => setAgendaMessage(e.target.value)} placeholder="Mensagem" rows={2} className="w-full bg-muted rounded px-2 py-1.5 text-[10px] resize-none" />
                    {appointmentPrice > 0 && <p className="text-[9px] text-muted-foreground">Confirmação: ${appointmentPrice} (10% comissão site)</p>}
                    <button type="button" onClick={submitAgenda} disabled={agendaSubmitting} className="w-full py-1.5 rounded text-[10px] font-bold text-white disabled:opacity-50" style={{ backgroundColor: accentColor }}>{agendaSubmitting ? "Enviando..." : "Enviar solicitação"}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AiChatWidget;
