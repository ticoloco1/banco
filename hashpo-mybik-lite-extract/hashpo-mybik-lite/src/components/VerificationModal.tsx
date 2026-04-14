import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMyBadge, useRequestBadge } from "@/hooks/useVerification";
import { useSettings } from "@/hooks/useSettings";
import { BadgeCheck, X, Building2, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
}

const VerificationModal = ({ open, onClose }: VerificationModalProps) => {
  const { user } = useAuth();
  const { data: badge } = useMyBadge();
  const { data: settings } = useSettings();
  const requestBadge = useRequestBadge();
  const [badgeType, setBadgeType] = useState<"personal" | "company">("personal");
  const [planType, setPlanType] = useState<"monthly" | "annual">("monthly");
  const [fullName, setFullName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [companyName, setCompanyName] = useState("");

  if (!open) return null;

  const s = settings as any;

  // Read prices from admin settings (with fallback defaults)
  const personalMonthly = s?.badge_personal_monthly ?? 8.00;
  const personalAnnual = s?.badge_personal_annual ?? 86.40;
  const companyMonthly = s?.badge_company_monthly ?? 41.67;
  const companyAnnual = s?.badge_company_annual ?? 450.00;
  const personalEnabled = s?.badge_personal_enabled ?? true;
  const companyEnabled = s?.badge_company_enabled ?? true;

  const currentPrice = badgeType === "personal"
    ? (planType === "annual" ? personalAnnual : personalMonthly)
    : (planType === "annual" ? companyAnnual : companyMonthly);

  const personalDiscount = personalMonthly > 0 ? Math.round((1 - personalAnnual / (personalMonthly * 12)) * 100) : 10;
  const companyDiscount = companyMonthly > 0 ? Math.round((1 - companyAnnual / (companyMonthly * 12)) * 100) : 10;

  const handleSubmit = async () => {
    if (!fullName || !docNumber) return toast.error("Preencha todos os campos obrigatórios");
    if (badgeType === "company" && !companyName) return toast.error("Informe o nome da empresa");
    try {
      await requestBadge.mutateAsync({ badge_type: badgeType, plan_type: planType, full_name: fullName, document_number: docNumber, company_name: companyName });
      toast.success("Solicitação enviada! A IA está verificando seus dados...");
      onClose();
    } catch (e: any) { toast.error(e.message); }
  };

  if (badge?.status === "active") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
        <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 space-y-4 relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          <div className="text-center space-y-3">
            <BadgeCheck className="w-16 h-16 mx-auto" style={{ color: badge.badge_type === "company" ? "#FFD700" : "#1D9BF0" }} fill={badge.badge_type === "company" ? "#FFD700" : "#1D9BF0"} stroke="white" />
            <h2 className="text-lg font-bold text-card-foreground">Você já é verificado!</h2>
            <p className="text-xs text-muted-foreground">
              Tipo: <strong>{badge.badge_type === "company" ? "Empresa" : "Pessoal"}</strong> ·
              Expira: <strong>{new Date(badge.expires_at!).toLocaleDateString("pt-BR")}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (badge?.status === "pending") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
        <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 space-y-4 relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          <div className="text-center space-y-3">
            <Sparkles className="w-12 h-12 mx-auto text-primary animate-pulse" />
            <h2 className="text-lg font-bold text-card-foreground">Verificação em análise</h2>
            <p className="text-xs text-muted-foreground">Nossa IA está analisando seus dados. Isso pode levar alguns minutos.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>

        <div className="flex items-center gap-3">
          <BadgeCheck className="w-6 h-6 text-[#1D9BF0]" fill="#1D9BF0" stroke="white" strokeWidth={1.5} />
          <h2 className="text-sm font-bold text-card-foreground uppercase">Selo de Verificação</h2>
        </div>

        <Tabs defaultValue="personal" onValueChange={v => { setBadgeType(v as any); setPlanType("monthly"); }}>
          <TabsList className="w-full">
            <TabsTrigger value="personal" className="flex-1 flex items-center gap-1.5" disabled={!personalEnabled}>
              <BadgeCheck className="w-4 h-4 text-[#1D9BF0]" fill="#1D9BF0" stroke="white" strokeWidth={1.5} />
              Pessoal {!personalEnabled && "(indisponível)"}
            </TabsTrigger>
            <TabsTrigger value="company" className="flex-1 flex items-center gap-1.5" disabled={!companyEnabled}>
              <BadgeCheck className="w-4 h-4 text-yellow-500" fill="#FFD700" stroke="white" strokeWidth={1.5} />
              Empresa {!companyEnabled && "(indisponível)"}
            </TabsTrigger>
          </TabsList>

          {/* ── Personal tab ── */}
          <TabsContent value="personal" className="space-y-3 pt-3">
            {!personalEnabled ? (
              <p className="text-xs text-muted-foreground text-center py-4">Verificação pessoal temporariamente indisponível.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPlanType("monthly")}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${planType === "monthly" ? "border-[#1D9BF0] bg-[#1D9BF0]/10" : "border-border"}`}>
                  <p className="text-lg font-black text-foreground">${personalMonthly.toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">Selo Azul Pessoal</p>
                </button>
                <button onClick={() => setPlanType("annual")}
                  className={`p-4 rounded-xl border-2 text-center transition-all relative ${planType === "annual" ? "border-[#1D9BF0] bg-[#1D9BF0]/10" : "border-border"}`}>
                  {personalDiscount > 0 && <span className="absolute -top-2 right-2 bg-[#1D9BF0] text-white text-[8px] font-bold px-2 py-0.5 rounded-full">-{personalDiscount}%</span>}
                  <p className="text-lg font-black text-foreground">${personalAnnual.toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/ano</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">${(personalAnnual / 12).toFixed(2)}/mês</p>
                </button>
              </div>
            )}
          </TabsContent>

          {/* ── Company tab ── */}
          <TabsContent value="company" className="space-y-3 pt-3">
            {!companyEnabled ? (
              <p className="text-xs text-muted-foreground text-center py-4">Verificação empresarial temporariamente indisponível.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPlanType("monthly")}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${planType === "monthly" ? "border-[#FFD700] bg-[#FFD700]/10" : "border-border"}`}>
                    <p className="text-lg font-black text-foreground">${companyMonthly.toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                    <p className="text-[10px] text-muted-foreground mt-1">Selo Gold Empresa</p>
                  </button>
                  <button onClick={() => setPlanType("annual")}
                    className={`p-4 rounded-xl border-2 text-center transition-all relative ${planType === "annual" ? "border-[#FFD700] bg-[#FFD700]/10" : "border-border"}`}>
                    {companyDiscount > 0 && <span className="absolute -top-2 right-2 bg-[#FFD700] text-black text-[8px] font-bold px-2 py-0.5 rounded-full">-{companyDiscount}%</span>}
                    <p className="text-lg font-black text-foreground">${companyAnnual.toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/ano</span></p>
                    <p className="text-[10px] text-muted-foreground mt-1">${(companyAnnual / 12).toFixed(2)}/mês</p>
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Nome da Empresa</label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: HASHPO Inc." />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Nome Completo</label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome completo" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Nº Documento (CPF/CNPJ/ID)</label>
            <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="000.000.000-00" />
          </div>
        </div>

        <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
          <p>🤖 <strong>Verificação com IA</strong> — Seus dados serão analisados automaticamente</p>
          <p>🔒 Dados protegidos e criptografados</p>
          <p>⚡ Aprovação em até 5 minutos</p>
        </div>

        <button onClick={handleSubmit} disabled={requestBadge.isPending || (badgeType === "personal" && !personalEnabled) || (badgeType === "company" && !companyEnabled)}
          className="w-full py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
          style={{ backgroundColor: badgeType === "company" ? "#FFD700" : "#1D9BF0", color: badgeType === "company" ? "#000" : "#fff" }}>
          {requestBadge.isPending ? "Processando..." : `Pagar $${currentPrice.toFixed(2)} e Verificar`}
        </button>
      </div>
    </div>
  );
};

export default VerificationModal;
