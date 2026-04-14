"use client";

// WhatsApp-style check marks: ✓ sent, ✓✓ delivered, ✓✓ blue = read
function CheckIcon({ read }: { read: boolean }) {
  return (
    <svg viewBox="0 0 16 11" width="16" height="11" className="inline-block ml-1 -mb-0.5">
      {/* Double check mark */}
      <path
        d="M11.07 0.73L4.53 7.27 2.43 5.17 1.02 6.58 4.53 10.09 12.48 2.14z"
        fill={read ? "#53bdeb" : "currentColor"}
      />
      <path
        d="M14.07 0.73L7.53 7.27 6.83 6.57 5.42 7.98 7.53 10.09 15.48 2.14z"
        fill={read ? "#53bdeb" : "currentColor"}
      />
    </svg>
  );
}

function SingleCheckIcon() {
  return (
    <svg viewBox="0 0 12 11" width="12" height="11" className="inline-block ml-1 -mb-0.5">
      <path
        d="M10.07 0.73L3.53 7.27 1.43 5.17 0.02 6.58 3.53 10.09 11.48 2.14z"
        fill="currentColor"
      />
    </svg>
  );
}

interface MessageBubbleProps {
  content: string;
  isSent: boolean;
  time: string;
  flagged?: boolean;
  readAt?: string | null;
}

export default function MessageBubble({ content, isSent, time, flagged, readAt }: MessageBubbleProps) {
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
          className={`text-[10px] mt-1 text-right flex items-center justify-end gap-0 ${
            isSent ? "text-black/50" : "text-muted"
          }`}
        >
          {timeStr}
          {isSent && (
            readAt ? <CheckIcon read={true} /> : <CheckIcon read={false} />
          )}
        </p>
      </div>
    </div>
  );
}
