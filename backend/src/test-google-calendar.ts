
import { scrapeGoogleCalendar } from './scrapers/google-calendar';

async function main() {
    await scrapeGoogleCalendar();
}

main().catch(console.error);
