
export interface ParsedEventDetails {
    organizer: string;
    content: string;
    joinMethod: string;
}

export const parseEventDescription = (description: string = ''): ParsedEventDetails => {
    const details: ParsedEventDetails = {
        organizer: '情報なし',
        content: '情報なし',
        joinMethod: '情報なし',
    };

    if (!description) return details;

    // Helper to extract text between two markers
    const extract = (startMarker: string, endMarker: string): string | null => {
        const startIndex = description.indexOf(startMarker);
        const endIndex = description.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            return description.substring(startIndex + startMarker.length, endIndex).trim();
        }
        return null;
    };

    // 1. Organizer: 【イベント主催者】～【イベント内容】
    const organizer = extract('【イベント主催者】', '【イベント内容】');
    if (organizer) details.organizer = organizer;

    // 2. Content: 【イベント内容】～【イベントジャンル】
    const content = extract('【イベント内容】', '【イベントジャンル】');
    if (content) details.content = content;

    // 3. Join Via: 【参加方法】～【備考】
    const joinMethod = extract('【参加方法】', '【備考】');
    if (joinMethod) details.joinMethod = joinMethod;

    return details;
};
