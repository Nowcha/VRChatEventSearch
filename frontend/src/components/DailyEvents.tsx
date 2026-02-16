
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import type { Event } from '../types';
import EventCard from './EventCard';
import EventModal from './EventModal';
import { useFavorites } from '../hooks/useFavorites';

const DailyEvents: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentDate, setCurrentDate] = useState<string>('');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

    const { favorites, toggleFavorite, isFavorite } = useFavorites();

    useEffect(() => {
        fetchTodayEvents();
    }, []);

    const fetchTodayEvents = async () => {
        setLoading(true);
        try {
            // Calculate "Today" in JST/Local time
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

            setCurrentDate(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

            // Fetch from backend
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await axios.get(`${apiUrl}/api/events`, {
                params: {
                    start: startOfDay.toISOString(),
                    end: endOfDay.toISOString()
                }
            });

            const rawEvents = response.data;

            // Filter for 21:00 - 24:00
            const filteredEvents = rawEvents.filter((event: Event) => {
                const startTime = new Date(event.startTime);
                const hour = startTime.getHours();
                return hour >= 21 && hour <= 23; // 21:00 to 23:59
            });

            // Sort by time
            filteredEvents.sort((a: Event, b: Event) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

            setEvents(filteredEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const displayedEvents = useMemo(() => {
        if (showFavoritesOnly) {
            return events.filter(event => isFavorite(event.id));
        }
        return events;
    }, [events, showFavoritesOnly, favorites]); // Depend on favorites to update immediately

    return (
        <div className="p-6 bg-slate-900 min-h-screen text-white">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        VRChat Night Events
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">
                        {currentDate} • <span className="text-cyan-300 font-semibold">21:00 - 24:00</span>
                    </p>
                </div>
                <div className="flex gap-4 items-center">
                    {/* View Toggle */}
                    <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button
                            onClick={() => setShowFavoritesOnly(false)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${!showFavoritesOnly ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            All Events
                        </button>
                        <button
                            onClick={() => setShowFavoritesOnly(true)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 ${showFavoritesOnly ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span>Favorites</span>
                            <span className="bg-white/20 px-1.5 rounded-full text-xs">{favorites.length}</span>
                        </button>
                    </div>

                    <button
                        onClick={fetchTodayEvents}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 font-medium transition-colors"
                        title="Refresh"
                    >
                        🔄
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                </div>
            ) : displayedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-800/50 rounded-2xl border border-slate-800 border-dashed">
                    <div className="text-4xl mb-4">{showFavoritesOnly ? '💔' : '🌙'}</div>
                    <p className="text-xl font-medium">
                        {showFavoritesOnly ? 'No favorite events found.' : 'No events found for tonight (21:00 - 24:00)'}
                    </p>
                    <p className="text-sm mt-2">
                        {showFavoritesOnly ? 'Add events to your favorites to see them here.' : 'Try refreshing or check back later.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedEvents.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onClick={(e) => setSelectedEvent(e)}
                            isFavorite={isFavorite(event.id)}
                            onToggleFavorite={(e) => {
                                e.stopPropagation();
                                toggleFavorite(event.id);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    isFavorite={isFavorite(selectedEvent.id)}
                    onToggleFavorite={() => toggleFavorite(selectedEvent.id)}
                />
            )}
        </div>
    );
};

export default DailyEvents;
