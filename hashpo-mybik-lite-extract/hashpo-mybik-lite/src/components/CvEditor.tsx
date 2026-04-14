import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, GraduationCap, Code, MapPin, Plus, Trash2, Mail, Phone, Lock } from "lucide-react";

interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  year: string;
}

interface CvEditorProps {
  cvContent: string;
  setCvContent: (v: string) => void;
  cvHeadline: string;
  setCvHeadline: (v: string) => void;
  cvLocation: string;
  setCvLocation: (v: string) => void;
  cvSkills: string[];
  setCvSkills: (v: string[]) => void;
  cvExperience: Experience[];
  setCvExperience: (v: Experience[]) => void;
  cvEducation: Education[];
  setCvEducation: (v: Education[]) => void;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  contactPrice: string;
  setContactPrice: (v: string) => void;
}

export default function CvEditor({
  cvContent, setCvContent,
  cvHeadline, setCvHeadline,
  cvLocation, setCvLocation,
  cvSkills, setCvSkills,
  cvExperience, setCvExperience,
  cvEducation, setCvEducation,
  contactEmail, setContactEmail,
  contactPhone, setContactPhone,
  contactPrice, setContactPrice,
}: CvEditorProps) {
  const [newSkill, setNewSkill] = useState("");

  const addExperience = () => {
    setCvExperience([...cvExperience, { title: "", company: "", period: "", description: "" }]);
  };

  const updateExperience = (i: number, field: string, value: string) => {
    const updated = [...cvExperience];
    (updated[i] as any)[field] = value;
    setCvExperience(updated);
  };

  const removeExperience = (i: number) => {
    setCvExperience(cvExperience.filter((_, idx) => idx !== i));
  };

  const addEducation = () => {
    setCvEducation([...cvEducation, { degree: "", institution: "", year: "" }]);
  };

  const updateEducation = (i: number, field: string, value: string) => {
    const updated = [...cvEducation];
    (updated[i] as any)[field] = value;
    setCvEducation(updated);
  };

  const removeEducation = (i: number) => {
    setCvEducation(cvEducation.filter((_, idx) => idx !== i));
  };

  const addSkill = () => {
    if (newSkill.trim() && !cvSkills.includes(newSkill.trim())) {
      setCvSkills([...cvSkills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  return (
    <div className="space-y-5">
      {/* Headline & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Professional Headline
          </label>
          <Input value={cvHeadline} onChange={e => setCvHeadline(e.target.value)} placeholder="Ex: Full Stack Developer | 5 years exp." />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Location
          </label>
          <Input value={cvLocation} onChange={e => setCvLocation(e.target.value)} placeholder="Ex: São Paulo, BR" />
        </div>
      </div>

      {/* About */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">About / Bio Professional</label>
        <Textarea value={cvContent} onChange={e => setCvContent(e.target.value)} placeholder="Describe your experience, goals..." rows={4} />
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
          <Code className="w-3 h-3" /> Skills
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {cvSkills.map((s, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {s}
              <button onClick={() => setCvSkills(cvSkills.filter((_, idx) => idx !== i))} className="hover:text-destructive">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add skill..." className="flex-1" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} />
          <button onClick={addSkill} className="px-3 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-lg"><Plus className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Experience */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Experience
          </label>
          <button onClick={addExperience} className="flex items-center gap-1 text-[10px] text-primary font-bold hover:underline">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        {cvExperience.map((exp, i) => (
          <div key={i} className="bg-secondary/50 border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                <Input value={exp.title} onChange={e => updateExperience(i, "title", e.target.value)} placeholder="Job title" />
                <Input value={exp.company} onChange={e => updateExperience(i, "company", e.target.value)} placeholder="Company" />
                <Input value={exp.period} onChange={e => updateExperience(i, "period", e.target.value)} placeholder="2020 - Present" />
              </div>
              <button onClick={() => removeExperience(i)} className="ml-2 text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <Textarea value={exp.description} onChange={e => updateExperience(i, "description", e.target.value)} placeholder="Brief description..." rows={2} />
          </div>
        ))}
        {cvExperience.length === 0 && <p className="text-[10px] text-muted-foreground italic">No experience added. Click "Add" to start.</p>}
      </div>

      {/* Education */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <GraduationCap className="w-3 h-3" /> Education
          </label>
          <button onClick={addEducation} className="flex items-center gap-1 text-[10px] text-primary font-bold hover:underline">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        {cvEducation.map((edu, i) => (
          <div key={i} className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg p-3">
            <Input value={edu.degree} onChange={e => updateEducation(i, "degree", e.target.value)} placeholder="Degree" className="flex-1" />
            <Input value={edu.institution} onChange={e => updateEducation(i, "institution", e.target.value)} placeholder="Institution" className="flex-1" />
            <Input value={edu.year} onChange={e => updateEducation(i, "year", e.target.value)} placeholder="Year" className="w-20" />
            <button onClick={() => removeEducation(i)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>

      {/* Contact (Locked) */}
      <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3">
        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-primary" /> Contact Info (Blocked — Paid Unlock)
        </p>
        <p className="text-[10px] text-muted-foreground">Companies pay to unlock. Revenue split 50/50.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
            <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="your@email.com" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
            <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+55..." />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Unlock Price (USDC)</label>
          <div className="flex items-center gap-2">
            <Input type="number" value={contactPrice} onChange={e => setContactPrice(e.target.value)} min="1" step="1" className="w-28" />
            <span className="text-[10px] text-muted-foreground">You receive: ${(parseFloat(contactPrice || "0") / 2).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
