import React from "react";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Check, X, Shield, ShieldAlert } from "lucide-react";

interface QualityConfig {
  text: string;
  color: string;
  icon: JSX.Element;
}

const qualityConfig: Record<string, QualityConfig> = {
  excellent: {
    text: "Excelente",
    color: "text-green-400",
    icon: <Wifi size={14} />
  },
  good: { text: "Buena", color: "text-yellow-400", icon: <Wifi size={14} /> },
  fair: { text: "Regular", color: "text-orange-400", icon: <Wifi size={14} /> },
  poor: { text: "Mala", color: "text-red-500", icon: <WifiOff size={14} /> }
};

interface StatusIndicatorProps {
  label: string;
  status: any;
  type?: "connection" | "device" | "recording";
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  label,
  status,
  type = "connection"
}) => {
  const baseClasses = "flex items-center justify-between text-sm";
  const labelClasses = "text-slate-300";

  if (type === "connection") {
    const config = qualityConfig[status] || qualityConfig.poor;
    return (
      <div className={baseClasses}>
        <span className={labelClasses}>{label}</span>
        <div
          className={cn("flex items-center gap-2 font-medium", config.color)}
        >
          {config.icon}
          <span>{config.text}</span>
        </div>
      </div>
    );
  }

  if (type === "device") {
    const isEnabled = status;
    const color = isEnabled ? "text-green-400" : "text-red-400";
    const text = isEnabled ? "Activada" : "Desactivada";
    const Icon = isEnabled ? Check : X;
    return (
      <div className={baseClasses}>
        <span className={labelClasses}>{label}</span>
        <div className={cn("flex items-center gap-2 font-medium", color)}>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-current/20">
            <Icon size={12} className="text-current" />
          </div>
          <span>{text}</span>
        </div>
      </div>
    );
  }

  if (type === "recording") {
    const isRecording = status;
    const color = isRecording ? "text-red-400" : "text-slate-400";
    const text = isRecording ? "Grabando" : "Detenida";
    const Icon = isRecording ? ShieldAlert : Shield;
    return (
      <div className={baseClasses}>
        <span className={labelClasses}>{label}</span>
        <div className={cn("flex items-center gap-2 font-medium", color)}>
          <Icon size={14} className={isRecording ? "animate-pulse" : ""} />
          <span>{text}</span>
        </div>
      </div>
    );
  }

  return null;
};

export default StatusIndicator;
