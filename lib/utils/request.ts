import { createClient } from '@/lib/supabase/client';

export async function createRequestAndConversation(
  adId: string,
  requesterId: string,
  adOwnerId: string,
  initialMessage: string
) {
  const supabase = createClient();

  try {
    const { data: existingRequest } = await supabase
      .from('ad_requests')
      .select('id,conversation_id')
      .eq('ad_id', adId)
      .eq('requester_id', requesterId)
      .single();

    // Check if conversation already exists
    let conversationId: string;
    if (existingRequest?.conversation_id) {
      conversationId = existingRequest.conversation_id;
    } else {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_1_id.eq.${requesterId},participant_2_id.eq.${adOwnerId}),and(participant_1_id.eq.${adOwnerId},participant_2_id.eq.${requesterId})`
        )
        .single();

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            participant_1_id: requesterId < adOwnerId ? requesterId : adOwnerId,
            participant_2_id: requesterId < adOwnerId ? adOwnerId : requesterId,
          })
          .select('id')
          .single();

        if (convError || !newConv) throw convError;
        conversationId = newConv.id;
      }

      const { error: requestError } = await supabase.from('ad_requests').insert({
        ad_id: adId,
        requester_id: requesterId,
        conversation_id: conversationId,
      });

      if (requestError) throw requestError;
    }

    // Send initial message
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: requesterId,
      content: initialMessage,
    });

    if (msgError) throw msgError;

    return { success: true, conversationId };
  } catch (error) {
    console.error('Error creating request:', error);
    return { success: false, error };
  }
}

