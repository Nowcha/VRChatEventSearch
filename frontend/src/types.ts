
export interface Event {
    id: string;
    title: string;
    startTime: string;
    endTime?: string;
    description?: string;
    url?: string;
    imageUrl?: string;
    source: string;
}
