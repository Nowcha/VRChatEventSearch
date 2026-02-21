import React, { useMemo } from 'react';
import type { Event } from '../types';
import { parseEventDescription } from '../utils/eventParser';

interface EventModalProps {
    event: Event | null;
    onClose: () => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose, isFavorite, onToggleFavorite }) => {
    if (!event) return null;

    // stop propagation to prevent closing when clicking inside modal
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const startTime = new Date(event.startTime);
    const endTime = event.endTime ? new Date(event.endTime) : null;
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false, day: 'numeric', month: 'long', weekday: 'short' };
    const timeStr = `${startTime.toLocaleTimeString([], timeOptions)}${endTime ? ' - ' + endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}`;

    // Parse Description
    const details = useMemo(() => parseEventDescription(event.description || ''), [event.description]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={handleContentClick}
            >
                {/* Header Image */}
                <div className="relative h-48 bg-slate-950 shrink-0">
                    {event.imageUrl ? (
                        <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover opacity-80"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-950"></div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                    >
                        ✕
                    </button>

                    {/* Favorite Button (In Modal Header) */}
                    <button
                        onClick={onToggleFavorite}
                        className="absolute top-4 right-16 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                        <span className={`text-xl block ${isFavorite ? 'scale-110' : 'grayscale opacity-70'}`}>
                            {isFavorite ? '💖' : '🤍'}
                        </span>
                    </button>

                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-900 to-transparent p-6 pt-20">
                        <h2 className="text-2xl font-bold text-white shadow-black drop-shadow-md leading-tight">{event.title}</h2>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                            <h4 className="text-cyan-400 font-bold mb-1 uppercase text-xs tracking-wider">開催時間</h4>
                            <p className="text-white font-medium">{timeStr}</p>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                            <h4 className="text-cyan-400 font-bold mb-1 uppercase text-xs tracking-wider">主催者</h4>
                            <p className="text-white font-medium">{details.organizer}</p>
                        </div>
                    </div>

                    {/* Join Method */}
                    <div className="mb-6">
                        <h4 className="text-cyan-400 font-bold mb-2 uppercase text-xs tracking-wider">参加方法</h4>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-slate-300 font-medium">
                            {details.joinMethod}
                        </div>
                    </div>

                    {/* Content / Abstract */}
                    <div className="mb-6">
                        <h4 className="text-cyan-400 font-bold mb-2 uppercase text-xs tracking-wider">イベント内容</h4>
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 text-slate-200">
                            {details.content}
                        </div>
                    </div>

                    {/* Full Description (Raw) */}
                    <div className="mb-8">
                        <h4 className="text-slate-500 font-bold mb-2 uppercase text-xs tracking-wider">イベント詳細</h4>
                        <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap border-t border-slate-800 pt-4">
                            {event.description || 'No description available.'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventModal;
