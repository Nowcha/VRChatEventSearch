import React, { useMemo } from 'react';
import type { Event } from '../types';
import { parseEventDescription } from '../utils/eventParser';

interface EventCardProps {
    event: Event;
    onClick: (event: Event) => void;
    isFavorite: boolean;
    onToggleFavorite: (e: React.MouseEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick, isFavorite, onToggleFavorite }) => {
    // Format time (21:00 - 24:00)
    const startTime = new Date(event.startTime);
    const endTime = event.endTime ? new Date(event.endTime) : null;

    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
    const timeStr = `${startTime.toLocaleTimeString([], timeOptions)}${endTime ? ' - ' + endTime.toLocaleTimeString([], timeOptions) : ''}`;

    // Helper for Source styling (simplifed)
    let sourceIcon = 'G';
    let sourceColor = 'bg-red-600';
    let sourceName = 'Calendar';

    if (event.source === 'vrceve') {
        sourceIcon = 'V';
        sourceColor = 'bg-pink-600';
        sourceName = 'VRChat';
    }

    // Parse Description
    const details = useMemo(() => parseEventDescription(event.description || ''), [event.description]);

    return (
        <div
            onClick={() => onClick(event)}
            className="group cursor-pointer h-full flex flex-col bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 hover:border-cyan-400 transition-all duration-200 hover:shadow-cyan-500/10 hover:-translate-y-1 relative"
        >
            {/* Header: TIME & Source */}
            <div className="bg-slate-900 p-3 flex justify-between items-center border-b border-slate-700 pr-12">
                <span className="text-cyan-300 font-bold text-lg font-mono">{timeStr}</span>
                <div className={`text-xs font-bold px-2 py-1 rounded-full text-white flex items-center gap-1 ${sourceColor}`}>
                    <span>{sourceIcon}</span>
                    <span>{sourceName}</span>
                </div>
            </div>

            {/* Favorite Button (Absolute Top Right) */}
            <button
                onClick={onToggleFavorite}
                className="absolute top-2 right-2 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
                <span className={`text-xl transition-transform active:scale-95 ${isFavorite ? 'scale-110' : 'grayscale opacity-50 hover:opacity-100 hover:grayscale-0'}`}>
                    {isFavorite ? '💖' : '🤍'}
                </span>
            </button>

            {/* Body - No Image, just parsed info */}
            <div className="p-4 flex flex-col flex-grow gap-3">
                <h3 className="text-lg font-bold text-white leading-tight min-h-[3rem]">
                    {event.title}
                </h3>

                {/* Event Content (Parsed) */}
                <div className="text-sm">
                    <span className="text-slate-500 text-xs uppercase tracking-wider block mb-1">イベント内容</span>
                    <p className="text-slate-300 line-clamp-3 min-h-[3.75rem] font-medium">
                        {details.content}
                    </p>
                </div>

                {/* Info Grid: Organizer & Join Method */}
                <div className="mt-auto pt-3 border-t border-slate-700 grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <span className="text-slate-500 block mb-1">主催者</span>
                        <span className="text-white font-medium truncate block" title={details.organizer}>{details.organizer}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block mb-1">参加方法</span>
                        <span className="text-white font-medium truncate block" title={details.joinMethod}>{details.joinMethod}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
