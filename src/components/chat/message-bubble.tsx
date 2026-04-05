"use client";

interface MessageBubbleProps {
  content: string;
  isSent: boolean;
  time: string;
  flagged?: boolean;
}

export default function MessageBubble({ content, isSent, time, flagged }: MessageBubbleProps) {
  const timeStr = new Date(time).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 ${
          isSent
            ? "gradient-primary text-black rounded-2xl rounded-br-sm"
            : "glass-card rounded-2xl rounded-bl-sm"
        } ${flagged ? "opacity-60" : ""}`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        <p
          className={`text-[10px] mt-1 text-right ${
            isSent ? "text-black/50" : "text-muted"
          }`}
        >
          {timeStr}
        </p>
      </div>
    </div>
  );
}
