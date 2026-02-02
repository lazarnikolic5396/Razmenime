'use client';

import { formatDateTime } from '@/lib/utils/date';
import Card from '@/components/ui/Card';

interface Conversation {
  id: string;
  participantName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  avatarUrl?: string;
}

interface ChatListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export default function ChatList({ conversations, selectedId, onSelect }: ChatListProps) {
  if (conversations.length === 0) {
    return (
      <Card>
        <p className="text-[#666666] text-center py-8">Nemate razgovora</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Card
          key={conversation.id}
          padding="md"
          className={`cursor-pointer transition-all ${
            selectedId === conversation.id ? 'bg-red-50 border-2 border-[#E53935]' : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelect(conversation.id)}
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-[#E53935] flex items-center justify-center text-white font-semibold flex-shrink-0">
              {conversation.participantName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-[#333333] truncate">
                  {conversation.participantName}
                </h3>
                {conversation.lastMessageAt && (
                  <span className="text-xs text-[#666666] flex-shrink-0 ml-2">
                    {formatDateTime(conversation.lastMessageAt)}
                  </span>
                )}
              </div>
              {conversation.lastMessage && (
                <p className="text-sm text-[#666666] truncate mb-1">
                  {conversation.lastMessage}
                </p>
              )}
              {conversation.unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 bg-[#E53935] text-white text-xs rounded-full">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

