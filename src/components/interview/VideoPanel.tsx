import React from "react";
import { User, Video, VideoOff } from "lucide-react";
import { MESSAGES } from "@/constants/text";

interface VideoPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isVideoEnabled: boolean;
}

const VideoPanel: React.FC<VideoPanelProps> = ({
  videoRef,
  isVideoEnabled
}) => {
  return (
    <div className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-700 shadow-lg mb-6">
      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${!isVideoEnabled ? "hidden" : ""}`}
        muted
        playsInline
      />
      {!isVideoEnabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
          <User className="w-24 h-24 text-slate-600 mb-4" />
          <p className="text-slate-400">{MESSAGES.CAMERA_DISABLED}</p>
        </div>
      )}
      <div className="absolute top-3 right-3 p-2 bg-black/50 rounded-full">
        {isVideoEnabled ? (
          <Video className="w-5 h-5 text-green-400" />
        ) : (
          <VideoOff className="w-5 h-5 text-red-400" />
        )}
      </div>
    </div>
  );
};

export default VideoPanel;
