
import React, { useEffect, useState } from 'react';
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
    const [isScraping, setIsScraping] = useState<boolean>(false);
    const [validFavoritesCount, setValidFavoritesCount] = useState<number>(0);
    const [notification, setNotification] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const { favorites, toggleFavorite, isFavorite } = useFavorites();

    useEffect(() => {
        fetchEvents();
    }, [showFavoritesOnly]); // Re-fetch when view mode changes

    // Sync favorites count with valid (time-filtered) events
    useEffect(() => {
        const updateFavoritesCount = async () => {
            if (favorites.length === 0) {
                setValidFavoritesCount(0);
                return;
            }
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                // Use POST to avoid URL length limits with many favorites
                const response = await axios.post(`${apiUrl}/api/events/batch`, {
                    ids: favorites
                });

                const valid = response.data.filter((event: Event) => {
                    const startTime = new Date(event.startTime);
                    const hour = startTime.getHours();
                    return hour >= 21 && hour <= 23;
                });
                setValidFavoritesCount(valid.length);
            } catch (error) {
                console.error('Error updating favorites count:', error);
            }
        };

        updateFavoritesCount();
    }, [favorites]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            let rawEvents: Event[] = [];

            if (showFavoritesOnly) {
                if (favorites.length === 0) {
                    setEvents([]);
                    setLoading(false);
                    return;
                }
                // Use POST to avoid URL length limits
                const response = await axios.post(`${apiUrl}/api/events/batch`, {
                    ids: favorites
                });
                rawEvents = response.data;
            } else {
                // Fetch "Today's" events (21:00 - 24:00)
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

                setCurrentDate(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

                const response = await axios.get(`${apiUrl}/api/events`, {
                    params: {
                        start: startOfDay.toISOString(),
                        end: endOfDay.toISOString()
                    }
                });
                rawEvents = response.data;
            }

            // Common Filter for 21:00 - 24:00
            const filteredEvents = rawEvents.filter((event: Event) => {
                const startTime = new Date(event.startTime);
                const hour = startTime.getHours();
                return hour >= 21 && hour <= 23; // 21:00 to 23:59
            }).sort((a: Event, b: Event) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

            setEvents(filteredEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManualScrape = async () => {
        setIsScraping(true);
        setNotification(null);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            await axios.post(`${apiUrl}/api/scrape`);
            setNotification({ text: 'Data update started. Please wait a moment and refresh.', type: 'success' });
            setTimeout(() => setNotification(null), 5000);
        } catch (error) {
            console.error('Error triggering scrape:', error);
            setNotification({ text: 'Failed to start data update.', type: 'error' });
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setIsScraping(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 min-h-screen text-white">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        VRChat Night Events
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">
                        {showFavoritesOnly ? (
                            <span className="text-pink-400 font-semibold">Your Favorites</span>
                        ) : (
                            <>
                                {currentDate} • <span className="text-cyan-300 font-semibold">21:00 - 24:00</span>
                            </>
                        )}
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
                            <span className="bg-white/20 px-1.5 rounded-full text-xs">{validFavoritesCount}</span>
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleManualScrape}
                            disabled={isScraping}
                            className={`px-4 py-2 rounded-lg border font-medium transition-colors flex items-center gap-2 ${isScraping ? 'bg-slate-700 text-slate-400 border-slate-700 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-cyan-900/50 hover:border-cyan-400/50'}`}
                            title="Update Data from Sources"
                        >
                            {isScraping ? (
                                <>
                                    <span className="animate-spin">🔄</span> Updating...
                                </>
                            ) : (
                                <>
                                    <span>⬇️</span> Update Data
                                </>
                            )}
                        </button>

                        <button
                            onClick={fetchEvents}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 font-medium transition-colors"
                            title="Refresh List"
                        >
                            🔄
                        </button>
                    </div>
                </div>
            </header>

            {notification && (
                <div className={`mb-6 p-4 flex items-center gap-3 rounded-lg border ${notification.type === 'success' ? 'bg-emerald-900/50 text-emerald-400 border-emerald-800' : 'bg-rose-900/50 text-rose-400 border-rose-800'}`}>
                    <span className="text-xl">{notification.type === 'success' ? '✅' : '❌'}</span>
                    <span className="font-medium">{notification.text}</span>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                </div>
            ) : events.length === 0 ? (
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
                    {events
                        .filter(event => !showFavoritesOnly || isFavorite(event.id))
                        .map(event => (
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
