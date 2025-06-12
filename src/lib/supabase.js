import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for chat operations
export const chatOperations = {
  // Create a new chat
  async createChat(title = 'New Chat') {
    const { data, error } = await supabase
      .from('chats')
      .insert([{ title }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get all chats
  async getChats() {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get messages for a specific chat
  async getChatMessages(chatId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Add a message to a chat
  async addMessage(chatId, role, content) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ chat_id: chatId, role, content }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update chat title
  async updateChatTitle(chatId, title) {
    const { data, error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete a chat and its messages
  async deleteChat(chatId) {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
    
    if (error) throw error
  }
} 