'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import MessageBubble from './MessageBubble';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface Message {
  id: string;
  content: string | null;
  attachmentUrl?: string | null;
  senderId: string;
  senderName: string;
  createdAt: string;
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  recipientName: string;
  recipientId: string;
}

type RecipientInfo = {
  full_name: string | null;
  user_role: string | null;
  avatar_url: string | null;
};

export default function ChatWindow({
  conversationId,
  currentUserId,
  recipientName,
  recipientId,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const bucketName =
    process.env.NEXT_PUBLIC_SUPABASE_CHAT_IMAGES_BUCKET || 'chat-images';

  useEffect(() => {
    loadMessages();
    loadRecipientInfo();
    const unsubscribe = subscribeToMessages();
    const intervalId = window.setInterval(() => {
      loadMessages();
    }, 4000);

    return () => {
      unsubscribe?.();
      window.clearInterval(intervalId);
    };
  }, [conversationId, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          attachment_url,
          sender_id,
          created_at,
          profiles!messages_sender_id_fkey(full_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/chat/ChatWindow.tsx:loadMessages:result',message:'messages loaded',data:{hasError:!!error,count:(data||[]).length,lastAttachment:((data||[]).slice(-1)[0] as any)?.attachment_url ?? null,lastContent:((data||[]).slice(-1)[0] as any)?.content ?? null},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      if (error) throw error;

      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        attachmentUrl: msg.attachment_url,
        senderId: msg.sender_id,
        senderName: msg.profiles?.full_name || 'Anoniman',
        createdAt: msg.created_at,
      }));

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/chat/ChatWindow.tsx:loadMessages:formatted',message:'messages formatted',data:{count:formattedMessages.length,lastAttachment:formattedMessages.slice(-1)[0]?.attachmentUrl ?? null,lastContent:formattedMessages.slice(-1)[0]?.content ?? null},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipientInfo = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name,user_role,avatar_url')
      .eq('id', recipientId)
      .single();

    setRecipientInfo(data ?? null);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Load new message
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !imageFile) return;

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/chat/ChatWindow.tsx:sendMessage:start',message:'send message start',data:{hasText:!!newMessage.trim(),hasImage:!!imageFile},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      let attachmentUrl: string | null = null;
      if (imageFile) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${currentUserId}/${Date.now()}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, imageFile, { upsert: false });

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/chat/ChatWindow.tsx:sendMessage:upload',message:'upload result',data:{hasUploadError:!!uploadError,bucket:bucketName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        attachmentUrl = data?.publicUrl || null;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/chat/ChatWindow.tsx:sendMessage:url',message:'public url',data:{hasUrl:!!attachmentUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
      }

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage.trim() || '📷',
        attachment_url: attachmentUrl,
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/chat/ChatWindow.tsx:sendMessage:insert',message:'message insert',data:{hasInsertError:!!error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      if (error) throw error;

      setNewMessage('');
      setImageFile(null);
      setImagePreview(null);
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/chat/ChatWindow.tsx:sendMessage:catch',message:'send message error',data:{errorType:typeof error,hasMessage:!!(error as any)?.message,code:(error as any)?.code ?? null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Card className="flex flex-col h-[600px]" padding="none">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        {recipientInfo?.avatar_url && (
          <img
            src={recipientInfo.avatar_url}
            alt={recipientName}
            className="h-10 w-10 rounded-full object-cover"
          />
        )}
        <div>
          <h3 className="font-semibold text-[#333333]">{recipientName}</h3>
          {recipientInfo?.user_role && (
            <p className="text-xs text-gray-500 capitalize">{recipientInfo.user_role}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="text-center text-[#666666] py-8">Učitavanje poruka...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-[#666666] py-8">Nema poruka. Pošaljite prvu poruku!</div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              content={message.content}
              attachmentUrl={message.attachmentUrl}
              isOwn={message.senderId === currentUserId}
              senderName={message.senderName}
              timestamp={message.createdAt}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-3">
        {imagePreview && (
          <div className="mb-3 flex items-center gap-3">
            <img
              src={imagePreview}
              alt="Nova slika"
              className="h-20 w-20 object-cover rounded border border-gray-200"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
            >
              Ukloni sliku
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Unesite poruku..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1"
          />
          <label className="inline-flex items-center justify-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                  event.target.value = '';
                }
              }}
            />
            <span className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#333333] hover:bg-gray-50">
              Dodaj sliku
            </span>
          </label>
          <Button
            variant="primary"
            onClick={sendMessage}
            disabled={!newMessage.trim() && !imageFile}
          >
            Pošalji
          </Button>
        </div>
      </div>
    </Card>
  );
}

