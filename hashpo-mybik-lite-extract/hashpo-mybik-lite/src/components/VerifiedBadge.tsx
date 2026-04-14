import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  type?: "personal" | "company";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-6 h-6" };

const VerifiedBadge = ({ type = "personal", size = "md", className = "" }: VerifiedBadgeProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <BadgeCheck
          className={`${SIZE_MAP[size]} inline-block shrink-0 ${className}`}
          style={{ color: type === "company" ? "#FFD700" : "#1D9BF0" }}
          fill={type === "company" ? "#FFD700" : "#1D9BF0"}
          stroke="white"
          strokeWidth={1.5}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {type === "company" ? "✅ Empresa Verificada" : "✅ Identidade Verificada"}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default VerifiedBadge;
