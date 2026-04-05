import { supabase } from "./supabase";

// Ensure user1_id < user2_id for unique constraint
function sortUserIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function getOrCreateConversation(currentUserId: string, otherUserId: string) {
  const [user1, user2] = sortUserIds(currentUserId, otherUserId);

  // Try to find existing
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user1_id", user1)
    .eq("user2_id", user2)
    .single();

  if (existing) return existing.id as string;

  // Create new
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user1_id: user1, user2_id: user2 })
    .select("id")
    .single();

  if (error) throw error;
  return created!.id as string;
}

export async function fetchConversations(userId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id, last_message_at, last_message_preview, created_at,
      user1:profiles!conversations_user1_id_fkey(id, full_name, email, avatar_url),
      user2:profiles!conversations_user2_id_fkey(id, full_name, email, avatar_url)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (error) throw error;

  // Map to a simpler format with the "other" user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((conv: any) => {
    const u1 = Array.isArray(conv.user1) ? conv.user1[0] : conv.user1;
    const u2 = Array.isArray(conv.user2) ? conv.user2[0] : conv.user2;
    const otherUser = u1?.id === userId ? u2 : u1;
    return {
      id: conv.id,
      otherUser: otherUser as { id: string; full_name: string; email: string; avatar_url: string | null },
      lastMessageAt: conv.last_message_at,
      lastMessagePreview: conv.last_message_preview,
    };
  });
}

export async function fetchMessages(conversationId: string, cursor?: string, limit = 50) {
  let query = supabase
    .from("messages")
    .select("id, sender_id, content, read_at, flagged, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).reverse(); // Return in chronological order
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim(),
    })
    .select("id, sender_id, content, read_at, flagged, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function markMessagesAsRead(conversationId: string, currentUserId: string) {
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", currentUserId)
    .is("read_at", null);

  if (error) throw error;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("get_unread_count", { uid: userId });
  if (error) return 0;
  return Number(data) || 0;
}

export async function searchUsers(query: string, currentUserId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .neq("id", currentUserId)
    .eq("is_admin", false)
    .is("deleted_at", null)
    .ilike("full_name", `%${query}%`)
    .limit(10);

  if (error) throw error;
  return data || [];
}

export async function checkUserBlocked(userId: string): Promise<{ blocked: boolean; warnings: number }> {
  const { data } = await supabase
    .from("chat_blocks")
    .select("warnings_count")
    .eq("user_id", userId)
    .single();

  if (!data) return { blocked: false, warnings: 0 };
  return { blocked: data.warnings_count >= 3, warnings: data.warnings_count };
}

export async function recordWarning(userId: string, reason: string) {
  // Try to update existing record
  const { data: existing } = await supabase
    .from("chat_blocks")
    .select("id, warnings_count")
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabase
      .from("chat_blocks")
      .update({ warnings_count: existing.warnings_count + 1, reason })
      .eq("id", existing.id);
    return existing.warnings_count + 1;
  }

  // Create new record with first warning
  await supabase
    .from("chat_blocks")
    .insert({ user_id: userId, warnings_count: 1, reason });
  return 1;
}

export async function getConversationPartner(conversationId: string, currentUserId: string) {
  const { data } = await supabase
    .from("conversations")
    .select(`
      user1:profiles!conversations_user1_id_fkey(id, full_name, avatar_url),
      user2:profiles!conversations_user2_id_fkey(id, full_name, avatar_url)
    `)
    .eq("id", conversationId)
    .single();

  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const u1 = Array.isArray(d.user1) ? d.user1[0] : d.user1;
  const u2 = Array.isArray(d.user2) ? d.user2[0] : d.user2;
  const partner = u1?.id === currentUserId ? u2 : u1;
  return partner as { id: string; full_name: string; avatar_url: string | null };
}

// =============================================
// General Chat (group chat for all users)
// =============================================

export async function fetchGeneralMessages(cursor?: string, limit = 50) {
  let query = supabase
    .from("general_messages")
    .select("id, sender_id, content, flagged, created_at, profiles(full_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).reverse().map((msg: any) => ({
    ...msg,
    sender_name: Array.isArray(msg.profiles) ? msg.profiles[0]?.full_name : msg.profiles?.full_name,
    sender_avatar: Array.isArray(msg.profiles) ? msg.profiles[0]?.avatar_url : msg.profiles?.avatar_url,
  }));
}

// Fetch all clients with their last private message (for admin sidebar)
export async function fetchAllClientsForChat(adminId: string) {
  // Get all non-admin, non-deleted profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("is_admin", false)
    .is("deleted_at", null)
    .order("full_name");

  if (!profiles) return [];

  // Get all conversations involving admin
  const { data: convos } = await supabase
    .from("conversations")
    .select("id, user1_id, user2_id, last_message_at, last_message_preview")
    .or(`user1_id.eq.${adminId},user2_id.eq.${adminId}`)
    .order("last_message_at", { ascending: false });

  // Get unread counts per conversation
  const { data: unreadMsgs } = await supabase
    .from("messages")
    .select("conversation_id")
    .neq("sender_id", adminId)
    .is("read_at", null);

  const unreadMap = new Map<string, number>();
  if (unreadMsgs) {
    for (const msg of unreadMsgs) {
      unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1);
    }
  }

  // Map conversations to client IDs
  const convoByClient = new Map<string, { conversationId: string; lastMessageAt: string | null; lastMessagePreview: string | null; unread: number }>();
  if (convos) {
    for (const c of convos) {
      const clientId = c.user1_id === adminId ? c.user2_id : c.user1_id;
      if (!convoByClient.has(clientId)) {
        convoByClient.set(clientId, {
          conversationId: c.id,
          lastMessageAt: c.last_message_at,
          lastMessagePreview: c.last_message_preview,
          unread: unreadMap.get(c.id) || 0,
        });
      }
    }
  }

  return profiles.map((p) => {
    const convo = convoByClient.get(p.id);
    return {
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      avatar_url: p.avatar_url,
      conversationId: convo?.conversationId || null,
      lastMessageAt: convo?.lastMessageAt || null,
      lastMessagePreview: convo?.lastMessagePreview || null,
      unread: convo?.unread || 0,
    };
  });
}

export async function sendGeneralMessage(senderId: string, content: string) {
  const { data, error } = await supabase
    .from("general_messages")
    .insert({ sender_id: senderId, content: content.trim() })
    .select("id, sender_id, content, flagged, created_at")
    .single();

  if (error) throw error;
  return data;
}
