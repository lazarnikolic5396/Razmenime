'use client';

import { formatDateTime } from '@/lib/utils/date';

interface MessageBubbleProps {
  content: string | null;
  attachmentUrl?: string | null;
  isOwn: boolean;
  senderName: string;
  timestamp: string;
}

export default function MessageBubble({
  content,
  attachmentUrl,
  isOwn,
  senderName,
  timestamp,
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <div className="text-xs text-[#666666] mb-1 ml-1">{senderName}</div>
        )}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwn
              ? 'bg-[#E53935] text-white'
              : 'bg-white border border-gray-200 text-[#333333]'
          }`}
        >
          {attachmentUrl && (
            <img
              src={attachmentUrl}
              alt="Priložena slika"
              className="mb-2 max-h-56 w-full object-cover rounded"
            />
          )}
          {content && <p className="text-sm">{content}</p>}
        </div>
        <div className={`text-xs text-[#666666] mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
          {formatDateTime(timestamp)}
        </div>
      </div>
    </div>
  );
}

