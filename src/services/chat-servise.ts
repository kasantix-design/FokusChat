// src/services/chat-service.ts

// Type-definisjoner
export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number; // Unix timestamp for enkelhet
  type: 'text' | 'image' | 'video' | 'voice' | 'file';
  fileData?: string; // Base64 for bilder/filer (i produksjon: URL)
  fileName?: string;
  status: 'sending' | 'sent' | 'failed' | 'read';
}

export interface Conversation {
  id: string;
  name: string;
  participants: string[];
  isGroup: boolean;
  isPinned: boolean;
  lastMessage?: Message;
  messages: Message[];
}

// Simulerer en "database" i localStorage for å dele data mellom faner
const STORAGE_KEY = 'fokus_chat_data';

class ChatService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(data: any) => void> = new Set();

  constructor() {
    // Opprett kanal for kommunikasjon mellom faner
    this.channel = new BroadcastChannel('fokus_chat_channel');
    
    // Lytt etter meldinger fra andre faner
    this.channel.onmessage = (event) => {
      this.listeners.forEach(listener => listener(event.data));
    };
  }

  // Hent alle samtaler fra localStorage
  getConversations(): Conversation[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Lagre samtaler til localStorage og broadcast til andre faner
  private saveAndBroadcast(conversations: Conversation[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    this.channel?.postMessage({ type: 'UPDATE_CONVERSATIONS', conversations });
  }

  // Opprett ny samtale
  createConversation(name: string, participants: string[], isGroup: boolean): Conversation {
    const conversations = this.getConversations();
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      name,
      participants,
      isGroup,
      isPinned: false,
      messages: [],
    };
    
    conversations.unshift(newConv);
    this.saveAndBroadcast(conversations);
    return newConv;
  }

  // Send melding
  sendMessage(conversationId: string, sender: string, text: string, type: Message['type'] = 'text', fileData?: string, fileName?: string) {
    const conversations = this.getConversations();
    const convIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (convIndex === -1) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender,
      text,
      timestamp: Date.now(),
      type,
      fileData,
      fileName,
      status: 'sending',
    };

    // Oppdater melding i samtalen
    conversations[convIndex].messages.push(newMessage);
    conversations[convIndex].lastMessage = newMessage;

    // Simuler "sending" -> "sent" etter 500ms
    setTimeout(() => {
      newMessage.status = 'sent';
      this.saveAndBroadcast(conversations);
    }, 500);

    this.saveAndBroadcast(conversations);
  }

  // Fest/Upphev fest
  togglePin(conversationId: string) {
    const conversations = this.getConversations();
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.isPinned = !conv.isPinned;
      // Flytt festet til toppen
      conversations.sort((a, b) => (b.isPinned === true ? 1 : 0) - (a.isPinned === true ? 1 : 0));
      this.saveAndBroadcast(conversations);
    }
  }

  // Slett samtale
  deleteConversation(conversationId: string) {
    const conversations = this.getConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    this.saveAndBroadcast(filtered);
  }

  // Lytt på endringer (for React-komponenter)
  subscribe(listener: (data: any) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const chatService = new ChatService();