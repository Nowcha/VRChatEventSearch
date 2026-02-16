import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';

interface Event {
    id: string;
    title: string;
    startTime: string;
    endTime?: string;
    description?: string;
    url?: string;
    source: string;
}

const Calendar: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await axios.get(`${apiUrl}/api/events`);
            // Map backend events to FullCalendar format
            const formattedEvents = response.data.map((event: any) => ({
                id: event.id,
                title: event.title,
                start: event.startTime,
                end: event.endTime,
                url: event.url,
                extendedProps: {
                    description: event.description,
                    source: event.source
                }
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    return (
        <div className="p-4 bg-slate-900 min-h-screen text-white">
            <h1 className="text-3xl font-bold mb-4 text-cyan-400">VRChat Events</h1>
            <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek'
                    }}
                    events={events}
                    eventContent={(eventInfo) => {
                        const source = eventInfo.event.extendedProps.source;
                        let icon = '📅';
                        let bgColor = '#3b82f6'; // default blue

                        if (source === 'x') {
                            icon = '𝕏';
                            bgColor = '#000000'; // X black
                        } else if (source === 'google-calendar') {
                            icon = 'G';
                            bgColor = '#ea4335'; // Google red
                        }

                        return (
                            <div className="flex items-center gap-1 overflow-hidden px-1 w-full" style={{ backgroundColor: bgColor, color: 'white', borderRadius: '4px' }}>
                                <span className="text-xs font-bold">{icon}</span>
                                <span className="text-xs truncate">{eventInfo.timeText} {eventInfo.event.title}</span>
                            </div>
                        );
                    }}
                    eventClick={(info) => {
                        info.jsEvent.preventDefault();
                        if (info.event.url) {
                            window.open(info.event.url, '_blank');
                        }
                    }}
                    height="80vh"
                    eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
                // Removed eventBackgroundColor as we control it in eventContent
                />
            </div>
        </div>
    );
};

export default Calendar;
