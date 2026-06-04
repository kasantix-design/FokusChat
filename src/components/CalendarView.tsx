import React, { useState, useMemo } from 'react';

// Typer
type EventType = 'private' | 'bulandet' | 'hovet' | 'hop' | 'custom';
type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: EventType;
  repeat: RepeatType;
  reminderMinutes: number;
  attendees: string[]; // Brukernavn
  createdBy: string;
  isPinned?: boolean;
}

interface CalendarViewProps {
  currentUser: string;
  isAdmin: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ currentUser, isAdmin }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  // Mock-data for hendelser (i produksjon: hentes fra Peergos)
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Møte BULANDET',
      description: 'Ukentlig møte for BULANDET',
      startDate: new Date(new Date().setHours(10, 0, 0, 0)),
      endDate: new Date(new Date().setHours(11, 0, 0, 0)),
      type: 'bulandet',
      repeat: 'weekly',
      reminderMinutes: 30,
      attendees: ['admin', 'user1', 'user2'],
      createdBy: 'admin',
    },
    {
      id: '2',
      title: 'Lunsj med Ola',
      description: 'Lunsj på café',
      startDate: new Date(new Date().setHours(12, 30, 0, 0)),
      endDate: new Date(new Date().setHours(13, 30, 0, 0)),
      type: 'private',
      repeat: 'none',
      reminderMinutes: 15,
      attendees: [currentUser],
      createdBy: currentUser,
    },
  ]);

  // Kalender-farger
  const calendarColors = {
    private: { bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-300', text: 'text-gray-800 dark:text-gray-200' },
    bulandet: { bg: 'bg-blue-100 dark:bg-blue-900', border: 'border-blue-300', text: 'text-blue-900 dark:text-blue-100' },
    hovet: { bg: 'bg-green-100 dark:bg-green-900', border: 'border-green-300', text: 'text-green-900 dark:text-green-100' },
    hop: { bg: 'bg-purple-100 dark:bg-purple-900', border: 'border-purple-300', text: 'text-purple-900 dark:text-purple-100' },
    custom: { bg: 'bg-yellow-100 dark:bg-yellow-900', border: 'border-yellow-300', text: 'text-yellow-900 dark:text-yellow-100' },
  };

  // Generer dager i måneden
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Fyll tomme dager før første dag i måneden
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Fyll dager i måneden
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  // Hent hendelser for en gitt dato
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      // Forenklet sjekk (i produksjon: håndter gjentakelser korrekt)
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Navigasjon
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Åpne modal for ny hendelse
  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  // Åpne modal for redigering
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  // Slett hendelse
  const handleDeleteEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Sjekk tillatelser
    if (event.createdBy !== currentUser && !isAdmin) {
      alert('Du har ikke tillatelse til å slette denne hendelsen.');
      return;
    }

    if (confirm('Er du sikker på at du vil slette denne hendelsen?')) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setShowModal(false);
    }
  };

  // Lagre hendelse (mock)
  const handleSaveEvent = (eventData: Partial<Event>) => {
    if (editingEvent) {
      // Oppdater eksisterende
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...eventData } as Event : e));
    } else {
      // Opprett ny
      const newEvent: Event = {
        id: `evt-${Date.now()}`,
        title: eventData.title || 'Ny hendelse',
        description: eventData.description || '',
        startDate: eventData.startDate || new Date(),
        endDate: eventData.endDate || new Date(new Date().setHours(new Date().getHours() + 1)),
        type: eventData.type || 'private',
        repeat: eventData.repeat || 'none',
        reminderMinutes: eventData.reminderMinutes || 0,
        attendees: eventData.attendees || [currentUser],
        createdBy: currentUser,
      };
      setEvents(prev => [...prev, newEvent]);
    }
    setShowModal(false);
  };

  // Formatere dato
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('nb-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">📅 Kalender</h2>
          <p className="text-sm text-gray-500">{formatDate(currentDate)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={goToToday} className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700">I dag</button>
          <button onClick={prevMonth} className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700">←</button>
          <button onClick={nextMonth} className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-700">→</button>
          <button onClick={handleAddEvent} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold">+ Hendelse</button>
        </div>
      </div>

      {/* Kalender-grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Ukedager */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-sm font-semibold text-gray-500">
          <div>Mån</div><div>Tirs</div><div>Ons</div><div>Tors</div><div>Fre</div><div>Lør</div><div>Søn</div>
        </div>

        {/* Dager */}
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day, index) => {
            if (!day) return <div key={index} className="h-24 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"></div>;
            
            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                onClick={() => { setSelectedDate(day); handleAddEvent(); }}
                className={`h-24 border border-gray-200 dark:border-gray-700 p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative ${isToday ? 'bg-blue-50 dark:bg-blue-900' : 'bg-white dark:bg-gray-800'}`}
              >
                <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map(evt => (
                    <div
                      key={evt.id}
                      onClick={(e) => { e.stopPropagation(); handleEditEvent(evt); }}
                      className={`text-xs p-1 rounded truncate cursor-pointer ${calendarColors[evt.type].bg} ${calendarColors[evt.type].text} border ${calendarColors[evt.type].border}`}
                      title={evt.title}
                    >
                      {evt.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">+{dayEvents.length - 3} flere</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for opprett/rediger */}
      {showModal && (
        <EventModal
          event={editingEvent}
          onClose={() => setShowModal(false)}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          currentUser={currentUser}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

// --- EVENT MODAL KOMPONENT (Innebygd for enkelhet) ---
interface EventModalProps {
  event: Event | null;
  onClose: () => void;
  onSave: (data: Partial<Event>) => void;
  onDelete: (id: string) => void;
  currentUser: string;
  isAdmin: boolean;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose, onSave, onDelete, currentUser, isAdmin }) => {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startDate, setStartDate] = useState(event?.startDate ? event.startDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(event?.endDate ? event.endDate.toISOString().slice(0, 16) : new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16));
  const [type, setType] = useState<EventType>(event?.type || 'private');
  const [repeat, setRepeat] = useState<RepeatType>(event?.repeat || 'none');
  const [reminder, setReminder] = useState(event?.reminderMinutes || 15);
  const [attendees, setAttendees] = useState(event?.attendees.join(', ') || currentUser);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type,
      repeat,
      reminderMinutes: reminder,
      attendees: attendees.split(',').map(a => a.trim()).filter(Boolean),
    });
  };

  const canDelete = event ? (event.createdBy === currentUser || isAdmin) : true;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold">{event ? 'Rediger hendelse' : 'Ny hendelse'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tittel</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beskrivelse</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Starttid</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sluttid</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kalender</label>
              <select value={type} onChange={(e) => setType(e.target.value as EventType)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white">
                <option value="private">Privat</option>
                <option value="bulandet">BULANDET</option>
                <option value="hovet">HOVET</option>
                <option value="hop">HOP</option>
                <option value="custom">Egen</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gjentakelse</label>
              <select value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatType)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white">
                <option value="none">Ingen</option>
                <option value="daily">Daglig</option>
                <option value="weekly">Ukentlig</option>
                <option value="monthly">Månedlig</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Påminnelse (minutter før)</label>
            <input type="number" value={reminder} onChange={(e) => setReminder(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" min="0" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Deltakere (kommaseparert)</label>
            <input type="text" value={attendees} onChange={(e) => setAttendees(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="brukernavn1, brukernavn2" />
            <p className="text-xs text-gray-500 mt-1">Brukernavn som skal inviteres.</p>
          </div>

          <div className="flex justify-between pt-4 border-t dark:border-gray-700">
            {canDelete && event && (
              <button type="button" onClick={() => onDelete(event.id)} className="text-red-500 hover:text-red-700 font-bold">Slett</button>
            )}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Avbryt</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">Lagre</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
