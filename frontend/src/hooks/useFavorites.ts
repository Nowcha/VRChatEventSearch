import { useState, useEffect } from 'react';

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        const storedFavorites = localStorage.getItem('vrc_event_favorites');
        if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
        }
    }, []);

    const toggleFavorite = (eventId: string) => {
        setFavorites(prev => {
            const newFavorites = prev.includes(eventId)
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId];

            localStorage.setItem('vrc_event_favorites', JSON.stringify(newFavorites));
            return newFavorites;
        });
    };

    const isFavorite = (eventId: string) => favorites.includes(eventId);

    return { favorites, toggleFavorite, isFavorite };
};
