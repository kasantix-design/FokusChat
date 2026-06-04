import React, { useState, useEffect, useRef } from 'react';
import { chatService, Conversation, Message } from '../services/chat-service';

interface ChatViewProps {
  currentUser: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatIsGroup, setNewChatIsGroup] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'none' | 'image' | 'video' | 'voice' | 'file'>('none');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hent samtaler ved oppstart
  useEffect(() => {
    const initialData = chatService.getConversations();
    setConversations(initialData);

    // Lytt på endringer fra andre faner
    const unsubscribe = chatService.subscribe((data) => {
      if (data.type === 'UPDATE_CONVERSATIONS') {
        setConversations(data.conversations);
      }
    });

    return () => unsubscribe();
  }, []);

  // Scroll til bunn ved ny melding
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  // Sorter: Festede øverst, så etter siste melding
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0);
  });

  // Filtrer basert på søk
  const filteredConversations = sortedConversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Send melding
  const sendMessage = () => {
    if (!newMessage.trim() && attachmentType === 'none') return;
    if (!selectedConversation) return;

    // Simuler fil-data hvis det er en bilde/vedlegg
    let fileData: string | undefined;
    let fileName: string | undefined;
    
    if (attachmentType !== 'none') {
      // I en ekte app ville vi lastet opp filen her
      // For nå simulerer vi med en placeholder
      fileData = `simulated_${attachmentType}_data`;
      fileName = `test.${attachmentType === 'image' ? 'jpg' : attachmentType === 'video' ? 'mp4' : attachmentType === 'voice' ? 'mp3' : 'pdf'}`;
    }

    chatService.sendMessage(
      selectedConversation.id,
      currentUser,
      newMessage,
      attachmentType !== 'none' ? attachmentType : 'text',
      fileData,
      fileName
    );

    setNewMessage('');
    setAttachmentType('none');
  };

  // Fest/opphev fest
  const togglePin = (convId: string) => {
    chatService.togglePin(convId);
  };

  // Slett samtale
  const deleteConversation = (convId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne samtalen?')) return;
    chatService.deleteConversation(convId);
    if (selectedConversation?.id === convId) {
      setSelectedConversation(null);
    }
  };

  // Opprett ny samtale
  const createNewChat = () => {
    if (!newChatName.trim()) return;
    const newConv = chatService.createConversation(
      newChatName,
      [currentUser],
      newChatIsGroup
    );
    setSelectedConversation(newConv);
    setShowNewChat(false);
    setNewChatName('');
    setNewChatIsGroup(false);
  };

  // Formater tid
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
  };

  // ===== SAMTALELISTE =====
  if (!selectedConversation) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold">💬 Chat</h2>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold"
            >
              + Ny
            </button>
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk i chatter..."
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>

        {/* Ny samtale-panel */}
        {showNewChat && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900 border-b dark:border-gray-700">
            <h3 className="font-bold mb-2">Ny samtale</h3>
            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="Navn på samtale/gruppe..."
              className="w-full px-3 py-2 border rounded-lg mb-2 text-sm dark:bg-gray-700 dark:text-white"
            />
            <label className="flex items-center gap-2 mb-2 text-sm">
              <input
                type="checkbox"
                checked={newChatIsGroup}
                onChange={(e) => setNewChatIsGroup(e.target.checked)}
              />
              Gruppechat
            </label>
            <button
              onClick={createNewChat}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-bold"
            >
              Opprett
            </button>
          </div>
        )}

        {/* Samtaleliste */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-4xl mb-2">💬</p>
              <p>Ingen chatter ennå</p>
              <p className="text-sm mt-1">Trykk "+ Ny" for å starte</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className="flex items-center gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 transition-colors"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  conv.isGroup ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {conv.isGroup ? '👥' : conv.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold truncate">
                      {conv.isPinned && <span className="mr-1">📌</span>}
                      {conv.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {conv.lastMessage ? formatTime(conv.lastMessage.timestamp) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 truncate">
                      {conv.lastMessage?.text || 'Ingen meldinger'}
                    </p>
                    {conv.lastMessage?.status === 'sending' && (
                      <span className="text-xs text-blue-500 ml-2">⏳</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ===== MELDINGSVISNING =====
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <button
          onClick={() => setSelectedConversation(null)}
          className="text-blue-600 hover:text-blue-800 text-lg"
        >
          ←
        </button>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
          selectedConversation.isGroup ? 'bg-blue-500' : 'bg-green-500'
        }`}>
          {selectedConversation.isGroup ? '👥' : selectedConversation.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="font-bold">{selectedConversation.name}</h3>
          <p className="text-xs text-gray-500">
            {selectedConversation.isGroup 
              ? `${selectedConversation.participants.length} deltakere` 
              : 'Online'}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => togglePin(selectedConversation.id)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
            title={selectedConversation.isPinned ? 'Fjern fest' : 'Fest'}
          >
            {selectedConversation.isPinned ? '📌' : '📍'}
          </button>
          <button
            onClick={() => deleteConversation(selectedConversation.id)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm text-red-500"
            title="Slett samtale"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Meldinger */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        {selectedConversation.messages.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-4xl mb-2">✉️</p>
            <p>Start samtalen!</p>
          </div>
        ) : (
          selectedConversation.messages.map(msg => {
            const isMine = msg.sender === currentUser;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  isMine 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-bl-none'
                }`}>
                  {selectedConversation.isGroup && !isMine && (
                    <p className="text-xs font-semibold text-blue-300 mb-1">{msg.sender}</p>
                  )}
                  
                  {msg.type === 'text' && <p>{msg.text}</p>}
                  {msg.type === 'image' && (
                    <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center">
                      <p className="text-2xl">🖼️</p>
                      <p className="text-xs mt-1 opacity-70">Bilde (simulert)</p>
                    </div>
                  )}
                  {msg.type === 'video' && (
                    <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center">
                      <p className="text-2xl">🎬</p>
                      <p className="text-xs mt-1 opacity-70">Video (simulert)</p>
                    </div>
                  )}
                  {msg.type === 'voice' && (
                    <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center">
                      <p className="text-2xl">🎤</p>
                      <p className="text-xs mt-1 opacity-70">Voice-melding (simulert)</p>
                    </div>
                  )}
                  {msg.type === 'file' && (
                    <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center">
                      <p className="text-2xl">📄</p>
                      <p className="text-xs mt-1 opacity-70">{msg.fileName || 'Fil'}</p>
                    </div>
                  )}
                  
                  <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                    {formatTime(msg.timestamp)}
                    {msg.status === 'sent' && isMine && <span className="ml-1">✓</span>}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Vedlegg-knapper */}
      {attachmentType !== 'none' && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900 border-t flex items-center justify-between">
          <span className="text-sm">
            {attachmentType === 'image' && '🖼️ Bilde valgt'}
            {attachmentType === 'video' && '🎬 Video valgt'}
            {attachmentType === 'voice' && '🎤 Voice-opptak'}
            {attachmentType === 'file' && '📄 Fil valgt'}
          </span>
          <button
            onClick={() => setAttachmentType('none')}
            className="text-red-500 text-sm font-bold"
          >
            Avbryt
          </button>
        </div>
      )}

      {/* Send felt */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
        <div className="flex gap-2 mb-2">
          <button onClick={() => setAttachmentType('image')} className="text-lg hover:scale-110 transition-transform" title="Bilde">🖼️</button>
          <button onClick={() => setAttachmentType('video')} className="text-lg hover:scale-110 transition-transform" title="Video">🎬</button>
          <button onClick={() => setAttachmentType('voice')} className="text-lg hover:scale-110 transition-transform" title="Voice">🎤</button>
          <button onClick={() => setAttachmentType('file')} className="text-lg hover:scale-110 transition-transform" title="Fil">📄</button>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Skriv en melding..."
            className="flex-1 px-4 py-2 border rounded-full dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() && attachmentType === 'none'}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-full font-bold"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};
