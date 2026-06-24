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
  const [showCreateMenu, setShowCreateMenu] = useState<'none' | 'chat' | 'event'>('none'); // For den store + knappen
  const [newChatName, setNewChatName] = useState('');
  const [newChatIsGroup, setNewChatIsGroup] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'none' | 'image' | 'video' | 'voice' | 'file'>('none');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hent samtaler ved oppstart og filtrer basert på sikkerhet
  useEffect(() => {
    const allConversations = chatService.getConversations();
    
    // 🔧 SIKKERHET: Vis kun samtaler hvor DU er deltaker
    const myConversations = allConversations.filter(conv => 
      conv.participants.includes(currentUser)
    );

    setConversations(myConversations);

    const unsubscribe = chatService.subscribe((data) => {
      if (data.type === 'UPDATE_CONVERSATIONS') {
        const updatedAll = data.conversations;
        const updatedMy = updatedAll.filter(conv => 
          conv.participants.includes(currentUser)
        );
        setConversations(updatedMy);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Skrive-indikator logikk
  useEffect(() => {
    if (newMessage.length > 0 && !isTyping) {
      setIsTyping(true);
      // I en ekte app sender vi "typing" status til serveren her
    } else if (newMessage.length === 0 && isTyping) {
      setIsTyping(false);
    }

    // Automatisk reset hvis brukeren stopper å skrive (simulert)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (newMessage.length === 0) setIsTyping(false);
    }, 2000);
  }, [newMessage]);

  // Scroll til bunn
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  // Sortering
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0);
  });

  // Søkefilter
  const filteredConversations = sortedConversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Send melding
  const sendMessage = () => {
    if (!newMessage.trim() && attachmentType === 'none') return;
    if (!selectedConversation) return;

    let fileData: string | undefined;
    let fileName: string | undefined;
    
    if (attachmentType !== 'none') {
      fileData = `simulated_${attachmentType}_data`;
      fileName = `test.${attachmentType === 'image' ? 'jpg' : attachmentType === 'video' ? 'mp4' : attachmentType === 'voice' ? 'mp3' : 'pdf'}`;
    }

    // Status start: sending -> sent -> read (rosa)
    const tempId = `temp-${Date.now()}`;
    
    chatService.sendMessage(
      selectedConversation.id,
      currentUser,
      newMessage,
      attachmentType !== 'none' ? attachmentType : 'text',
      fileData,
      fileName
    );

    // Simuler lesing etter 1 sekund (i sanntid med Peergos vil dette komme fra server)
    setTimeout(() => {
       // Her ville vi oppdatert statusen til 'read' via API
       console.log("Melding lest!"); 
    }, 1000);

    setNewMessage('');
    setAttachmentType('none');
    setShowCreateMenu('none');
  };

  // Opprett ny samtale
  const handleCreateChat = () => {
    if (!newChatName.trim()) return;
    const newConv = chatService.createConversation(
      newChatName,
      [currentUser], // Legger kun deg selv inn først, andre må inviteres senere
      newChatIsGroup
    );
    setSelectedConversation(newConv);
    setShowCreateMenu('none');
    setNewChatName('');
    setNewChatIsGroup(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
  };

  // ===== VISNING: LISTE OVER CHATTER =====
  if (!selectedConversation) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">💬 Chat</h2>
            {/* Den gamle knappen er fjernet! */}
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk i chatter..."
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Create Menu (Popper opp når man trykker +) */}
        {showCreateMenu === 'chat' && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900 border-b dark:border-gray-700 animate-fade-in">
            <h3 className="font-bold mb-2 text-blue-800 dark:text-blue-200">Ny samtale</h3>
            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="Navn på samtale/gruppe..."
              className="w-full px-3 py-2 border rounded-lg mb-2 text-sm dark:bg-gray-800 dark:text-white"
            />
            <label className="flex items-center gap-2 mb-3 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={newChatIsGroup}
                onChange={(e) => setNewChatIsGroup(e.target.checked)}
              />
              Gruppechat
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowCreateMenu('none')} className="flex-1 py-2 border rounded text-gray-600">Avbryt</button>
              <button onClick={handleCreateChat} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold">Opprett</button>
            </div>
          </div>
        )}

        {/* Samtaleliste */}
        <div className="flex-1 overflow-y-auto pb-20">
          {filteredConversations.length === 0 ? (
            <div className="text-center text-gray-500 py-12 mt-10">
              <p className="text-4xl mb-2">💬</p>
              <p>Ingen chatter ennå</p>
              <p className="text-sm mt-1">Trykk på <span className="bg-blue-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mx-1">+</span> nede for å starte</p>
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
                    <span className="font-semibold truncate text-gray-900 dark:text-gray-100">
                      {conv.isPinned && <span className="mr-1">📌</span>}
                      {conv.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {conv.lastMessage ? formatTime(conv.lastMessage.timestamp) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 truncate">
                      {conv.lastMessage?.sender === currentUser && 'Du: '}
                      {conv.lastMessage?.text || 'Ingen meldinger'}
                    </p>
                    {/* Status haker */}
                    {conv.lastMessage?.sender === currentUser && (
                      <span className={`ml-2 text-sm ${
                        conv.lastMessage.status === 'sent' ? 'text-green-500' : 'text-pink-500'
                      }`}>
                        {conv.lastMessage.status === 'sent' ? '✓' : '✓✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 🔧 STOR + KNAPP (Floating Action Button) */}
        <div className="fixed bottom-20 right-6 z-50">
          <button
            onClick={() => setShowCreateMenu(prev => prev === 'chat' ? 'none' : 'chat')}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl font-bold transform transition-transform hover:scale-110"
          >
            +
          </button>
        </div>
      </div>
    );
  }

  // ===== VISNING: ENKEL SAMTALE =====
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
        <button
          onClick={() => setSelectedConversation(null)}
          className="text-blue-600 hover:text-blue-800 text-xl"
        >
          ←
        </button>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
          selectedConversation.isGroup ? 'bg-blue-500' : 'bg-green-500'
        }`}>
          {selectedConversation.isGroup ? '👥' : selectedConversation.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">{selectedConversation.name}</h3>
          <p className="text-xs text-gray-500">
            {selectedConversation.isGroup 
              ? `${selectedConversation.participants.length} deltakere` 
              : 'Online'}
            {isTyping && <span className="ml-2 text-pink-500 font-semibold italic">skriver...</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={() => chatService.togglePin(selectedConversation.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm">
            📌
          </button>
          <button onClick={() => { if(confirm('Slette?')) { chatService.deleteConversation(selectedConversation.id); setSelectedConversation(null); }}} className="p-2 hover:bg-red-100 text-red-500 rounded-lg text-sm">
            🗑️
          </button>
        </div>
      </div>

      {/* Meldinger */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                  isMine 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-bl-none'
                }`}>
                  {selectedConversation.isGroup && !isMine && (
                    <p className="text-xs font-semibold text-blue-300 mb-1">{msg.sender}</p>
                  )}
                  
                  {msg.type === 'text' && <p>{msg.text}</p>}
                  {msg.type === 'image' && <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center"><p className="text-2xl">🖼️</p><p className="text-xs mt-1 opacity-70">Bilde</p></div>}
                  {msg.type === 'video' && <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center"><p className="text-2xl">🎬</p><p className="text-xs mt-1 opacity-70">Video</p></div>}
                  {msg.type === 'voice' && <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center"><p className="text-2xl">🎤</p><p className="text-xs mt-1 opacity-70">Voice</p></div>}
                  {msg.type === 'file' && <div className="bg-gray-200 dark:bg-gray-700 rounded p-2 text-center"><p className="text-2xl">📄</p><p className="text-xs mt-1 opacity-70">{msg.fileName}</p></div>}
                  
                  <div className="flex justify-end items-center gap-1 mt-1">
                    <p className={`text-xs ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>{formatTime(msg.timestamp)}</p>
                    {isMine && (
                      <span className={`text-xs ${
                        msg.status === 'sent' ? 'text-blue-200' : 'text-pink-300 font-bold'
                      }`}>
                        {msg.status === 'sent' ? '✓' : '✓✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Vedlegg valg (hvis aktiv) */}
      {attachmentType !== 'none' && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-800 dark:text-gray-200">
            {attachmentType === 'image' && '🖼️ Bilde valgt'}
            {attachmentType === 'video' && '🎬 Video valgt'}
            {attachmentType === 'voice' && '🎤 Voice-opptak'}
            {attachmentType === 'file' && '📄 Fil valgt'}
          </span>
          <button onClick={() => setAttachmentType('none')} className="text-red-500 text-sm font-bold">Avbryt</button>
        </div>
      )}

      {/* Send felt */}
      <div className="p-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
        <div className="flex gap-2 mb-2">
          <button onClick={() => setAttachmentType('image')} className="text-2xl hover:scale-110 transition-transform">🖼️</button>
          <button onClick={() => setAttachmentType('video')} className="text-2xl hover:scale-110 transition-transform">🎬</button>
          <button onClick={() => setAttachmentType('voice')} className="text-2xl hover:scale-110 transition-transform">🎤</button>
          <button onClick={() => setAttachmentType('file')} className="text-2xl hover:scale-110 transition-transform">📄</button>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Skriv en melding..."
            className="flex-1 px-4 py-2 border rounded-full dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() && attachmentType === 'none'}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-full font-bold transition-colors"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};
