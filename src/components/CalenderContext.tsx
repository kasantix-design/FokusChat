import React, { createContext, useContext, useState, ReactNode } from 'react';

export type EventType = 'private' | 'bulandet' | 'hovet' | 'hop' | 'custom';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
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

export const CalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Global liste over hendelser (i produksjon: hentes fra Peergos)
  const [events, setEvents] = useState<Event[]>([
    // Demo-hendelse for testing
    {
      id: 'demo-1',
      title: 'Demo: Møte BULANDET',
      description: 'Dette er en demo-hendelse for BULANDET',
      startDate: new Date(new Date().setHours(10, 0, 0, 0)),
      endDate: new Date(new Date().setHours(11, 0, 0, 0)),
      type: 'bulandet',
      repeat: 'none',
      reminderMinutes: 30,
      attendees: ['admin', 'user1', 'user2'],
      createdBy: 'admin',
    },
  ]);

  const addEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (id: string, data: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // Hovedlogikk for filtering
  const getFilteredEvents = (currentUser: string, calendarType: 'all' | 'private' | EventType): Event[] => {
    return events.filter(event => {
      // 1. Samle Kalender ('all'): Vis ALT du har tilgang til
      if (calendarType === 'all') {
        // Privat: Kun dine egne
        if (event.type === 'private' && event.createdBy === currentUser) return true;
        // Felleskalendere: Hvis du er invitert (i attendees)
        if (['bulandet', 'hovet', 'hop', 'custom'].includes(event.type)) {
          return event.attendees.includes(currentUser);
        }
        return false;
      }

      // 2. Privat Kalender: Kun dine egne hendelser (uansett hvilken type de er)
      if (calendarType === 'private') {
        return event.createdBy === currentUser;
      }

      // 3. Spesifikk Kalender (BULANDET, HOVET, HOP): Kun hendelser i denne typen + du er invitert
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
