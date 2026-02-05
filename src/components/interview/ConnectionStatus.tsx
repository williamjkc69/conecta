import { LABELS } from "@/constants/text";

interface ConnectionStatusProps {
  state: "idle" | "connecting" | "connected" | "ended" | "error";
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ state }) => {
  const getLabel = () => {
    switch (state) {
      case "idle":
        return LABELS.READY_TO_START;
      case "connecting":
        return LABELS.CONNECTING;
      case "connected":
        return LABELS.CONNECTED;
      case "ended":
        return LABELS.INTERVIEW_FINISHED;
      case "error":
        return LABELS.CONNECTION_ERROR;
      default:
        return LABELS.UNKNOWN;
    }
  };

  const getColor = () => {
    switch (state) {
      case "connected":
        return "text-green-400";
      case "connecting":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <p className={`text-center font-medium ${getColor()}`}>{getLabel()}</p>
  );
};

export default ConnectionStatus;
