import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type EventType = 'private' | 'bulandet' | 'hovet' | 'hop' | 'custom';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string; // Lagret som ISO string for localStorage kompatibilitet
  endDate: string;
  type: EventType;
  repeat: RepeatType;
  reminderMinutes: number;
  attendees: string[];
  createdBy: string;
}

interface CalendarContextType {
  events: Event[];
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, data: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  getFilteredEvents: (currentUser: string, calendarType: 'all' | 'private' | EventType) => Event[];
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

// Farge-definisjon som ikke påvirkes av tema (lys/mørk/rosa)
export const CALENDAR_COLORS = {
  private: { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-400' },
  bulandet: { bg: 'bg-blue-200', text: 'text-blue-900', border: 'border-blue-500' },
  hovet: { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-500' },
  hop: { bg: 'bg-purple-200', text: 'text-purple-900', border: 'border-purple-500' },
  custom: { bg: 'bg-yellow-200', text: 'text-yellow-900', border: 'border-yellow-500' },
  all: { bg: 'bg-indigo-200', text: 'text-indigo-900', border: 'border-indigo-500' },
};

export const CalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Laster fra localStorage ved oppstart
  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('fokus_events');
    if (saved) {
      try {
        return JSON.parse(saved).map((e: any) => ({
          ...e,
          startDate: new Date(e.startDate).toISOString(),
          endDate: new Date(e.endDate).toISOString(),
        }));
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'demo-1',
        title: 'Demo: Møte BULANDET',
        description: 'Dette er en demo-hendelse for BULANDET',
        startDate: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
        endDate: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
        type: 'bulandet',
        repeat: 'none',
        reminderMinutes: 30,
        attendees: ['admin', 'user1', 'user2'],
        createdBy: 'admin',
      },
    ];
  });

  // Lagrer til localStorage når events endres
  useEffect(() => {
    const serializableEvents = events.map(e => ({
      ...e,
      startDate: new Date(e.startDate).toISOString(),
      endDate: new Date(e.endDate).toISOString(),
    }));
    localStorage.setItem('fokus_events', JSON.stringify(serializableEvents));
  }, [events]);

  const addEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startDate: eventData.startDate instanceof Date ? eventData.startDate.toISOString() : eventData.startDate,
      endDate: eventData.endDate instanceof Date ? eventData.endDate.toISOString() : eventData.endDate,
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (id: string, data: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // 🔧 SIKKERHETS-FILTER LOGIKK
  const getFilteredEvents = (currentUser: string, calendarType: 'all' | 'private' | EventType): Event[] => {
    return events.filter(event => {
      // 1. Samle Kalender ('all'): Vis ALT du har tilgang til
      if (calendarType === 'all') {
        // Privat: Kun dine egne
        if (event.type === 'private' && event.createdBy === currentUser) return true;
        // Felleskalendere: Hvis du er invitert
        if (['bulandet', 'hovet', 'hop', 'custom'].includes(event.type)) {
          return event.attendees.includes(currentUser);
        }
        return false;
      }

      // 2. Privat Kalender: Kun dine egne hendelser
      if (calendarType === 'private') {
        return event.createdBy === currentUser;
      }

      // 3. Spesifikk Kalender (BULANDET, HOVET, HOP): Kun hendelser av denne typen + du er invitert
      if (event.type === calendarType) {
        return event.attendees.includes(currentUser);
      }

      return false;
    });
  };

  return (
    <CalendarContext.Provider value={{ events, addEvent, updateEvent, deleteEvent, getFilteredEvents }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) throw new Error('useCalendar must be used within a CalendarProvider');
  return context;
};
