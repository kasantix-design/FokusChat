import React, { useState, useMemo } from 'react';
import { useCalendar, EventType } from '../context/CalendarContext';

type ViewType = 'all' | 'private' | EventType;

interface CalendarViewProps {
  currentUser: string;
  isAdmin: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ currentUser, isAdmin }) => {
  const { events, addEvent, updateEvent, deleteEvent, getFilteredEvents } = useCalendar();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<ViewType>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const displayedEvents = useMemo(() => {
    return getFilteredEvents(currentUser, selectedView);
  }, [events, currentUser, selectedView, getFilteredEvents]);

  // 🔧 KORRIGERT FARGER (med label for hver)
  const calendarColors = {
    all: { bg: 'bg-indigo-100 dark:bg-indigo-900', border: 'border-indigo-300', text: 'text-indigo-900 dark:text-indigo-100', label: 'Samle Kalender' },
    private: { bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-300', text: 'text-gray-800 dark:text-gray-200', label: 'Privat' },
    bulandet: { bg: 'bg-blue-100 dark:bg-blue-900', border: 'border-blue-300', text: 'text-blue-900 dark:text-blue-100', label: 'BULANDET' },
    hovet: { bg: 'bg-green-100 dark:bg-green-900', border: 'border-green-300', text: 'text-green-900 dark:text-green-100', label: 'HOVET' },
    hop: { bg: 'bg-purple-100 dark:bg-purple-900', border: 'border-purple-300', text: 'text-purple-900 dark:text-purple-100', label: 'HOP' },
    custom: { bg: 'bg-yellow-100 dark:bg-yellow-900', border: 'border-yellow-300', text: 'text-yellow-900 dark:text-yellow-100', label: 'Egen' },
  };

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));

    return days;
  }, [currentDate]);

  // 🔧 KORRIGERT: Sjekk om dato faller INNENFOR hendelsesperiode (flere dager)
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return displayedEvents.filter(event => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      // Sjekk om dato er mellom start og end (inklusive)
      return date >= start && date <= end;
    });
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    const event = displayedEvents.find((e: any) => e.id === eventId);
    if (!event) return;

    if (event.createdBy !== currentUser && !isAdmin) {
      alert('Du har ikke tillatelse til å slette denne hendelsen.');
      return;
    }

    if (confirm('Er du sikker på at du vil slette denne hendelsen?')) {
      deleteEvent(eventId);
      setShowModal(false);
    }
  };

  const handleSaveEvent = (eventData: any) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
    } else {
      addEvent({
        ...eventData,
        createdBy: currentUser,
        attendees: eventData.attendees || [currentUser],
      });
    }
    setShowModal(false);
  };

  const formatDate = (date: Date) => date.toLocaleDateString('nb-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex flex-col gap-3">
        <div className="flex justify-between items-center">
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

        {/* 🔧 KORRIGERT: Kalender-valgmeny med riktige farger */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'private', 'bulandet', 'hovet', 'hop', 'custom'] as ViewType[]).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedView(key)}
              className={`px-3 py-1 text-sm rounded-full border transition-all ${
                selectedView === key
                  ? `${calendarColors[key].bg} ${calendarColors[key].text} ${calendarColors[key].border} font-bold ring-2 ring-offset-1 ring-blue-500`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {calendarColors[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-sm font-semibold text-gray-500">
          <div>Mån</div><div>Tirs</div><div>Ons</div><div>Tors</div><div>Fre</div><div>Lør</div><div>Søn</div>
        </div>

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
                  {dayEvents.slice(0, 3).map((evt: any) => (
                    <div
                      key={evt.id}
                      onClick={(e) => { e.stopPropagation(); handleEditEvent(evt); }}
                      className={`text-xs p-1 rounded truncate cursor-pointer ${calendarColors[evt.type].bg} ${calendarColors[evt.type].text} border ${calendarColors[evt.type].border}`}
                      title={`${evt.title} (${calendarColors[evt.type].label})`}
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

// EventModal (samme som før)
interface EventModalProps {
  event: any;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
  currentUser: string;
  isAdmin: boolean;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose, onSave, onDelete, currentUser, isAdmin }) => {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startDate, setStartDate] = useState(event?.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : new Date(new Date().setHours(new Date().getHours() + 1)).toISOString().slice(0, 16));
  const [type, setType] = useState<EventType>(event?.type || 'private');
  const [repeat, setRepeat] = useState(event?.repeat || 'none');
  const [reminder, setReminder] = useState(event?.reminderMinutes || 15);
  const [attendees, setAttendees] = useState(event?.attendees?.join(', ') || currentUser);

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
      attendees: attendees.split(',').map((a: string) => a.trim()).filter(Boolean),
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
              <select value={repeat} onChange={(e) => setRepeat(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white">
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
