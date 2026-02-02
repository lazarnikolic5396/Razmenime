'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';

interface Conversation {
  id: string;
  participantName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  otherParticipantId: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId]);

  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
  }, [searchParams]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
    setLoading(false);
  };

  const loadConversations = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_1_id,
          participant_2_id,
          last_message_at,
          participant_1:profiles!conversations_participant_1_id_fkey(id, full_name),
          participant_2:profiles!conversations_participant_2_id_fkey(id, full_name)
        `)
        .or(`participant_1_id.eq.${currentUserId},participant_2_id.eq.${currentUserId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const formattedConversations: Conversation[] = await Promise.all(
        (data || []).map(async (conv: any) => {
          const otherParticipant =
            conv.participant_1_id === currentUserId ? conv.participant_2 : conv.participant_1;
          const otherParticipantId =
            conv.participant_1_id === currentUserId ? conv.participant_2_id : conv.participant_1_id;

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', currentUserId);

          return {
            id: conv.id,
            participantName: otherParticipant?.full_name || 'Anoniman',
            lastMessage: lastMessage?.content,
            lastMessageAt: lastMessage?.created_at || conv.last_message_at,
            unreadCount: count || 0,
            otherParticipantId,
          };
        })
      );

      setConversations(formattedConversations);

      const conversationId = searchParams.get('conversation');
      if (conversationId) {
        setSelectedConversationId(conversationId);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF7F7] flex items-center justify-center">
        <p className="text-[#666666]">Učitavanje...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-[#FDF7F7] flex items-center justify-center">
        <p className="text-[#666666]">Morate biti prijavljeni da biste videli razgovore</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-[#333333] mb-6">Poruke</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat List */}
          <div className="lg:col-span-1">
            <ChatList
              conversations={conversations}
              selectedId={selectedConversationId || undefined}
              onSelect={(id) => setSelectedConversationId(id)}
            />
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <ChatWindow
                conversationId={selectedConversation.id}
                currentUserId={currentUserId}
                recipientName={selectedConversation.participantName}
                recipientId={selectedConversation.otherParticipantId}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm h-[600px] flex items-center justify-center">
                <p className="text-[#666666]">Izaberite razgovor za početak</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

