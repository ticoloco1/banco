import { useState } from "react";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const REPORT_REASONS = [
  "Sexual Content / Nudity",
  "Violent or Repulsive Content",
  "Hate Speech / Harassment",
  "Copyright Infringement",
  "Spam or Misleading",
];

interface ReportButtonProps {
  videoId: string;
}

const ReportButton = ({ videoId }: ReportButtonProps) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleReport = async (reason: string) => {
    if (!user) {
      toast.error("Sign in to report content.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("video_reports" as any).insert({
        video_id: videoId,
        user_id: user.id,
        reason,
      } as any);
      if (error) throw error;

      // Increment report count on video
      const { data: vid } = await supabase
        .from("videos")
        .select("report_count")
        .eq("id", videoId)
        .single();

      const newCount = ((vid as any)?.report_count || 0) + 1;
      const updates: any = { report_count: newCount };
      if (newCount >= 5) updates.under_review = true;

      await supabase.from("videos").update(updates).eq("id", videoId);

      toast.success("Report submitted. Our team will review this content.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={submitting}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        >
          <Flag className="w-3.5 h-3.5" />
          Report
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {REPORT_REASONS.map((reason) => (
          <DropdownMenuItem
            key={reason}
            onClick={() => handleReport(reason)}
            className="text-xs cursor-pointer"
          >
            {reason}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReportButton;
