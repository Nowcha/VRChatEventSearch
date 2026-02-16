
import { scrapeGoogleCalendar } from './scrapers/google-calendar';

async function main() {
    try {
        await scrapeGoogleCalendar();
        console.log('Scrape complete.');
    } catch (e) {
        console.error(e);
    }
}

main();
