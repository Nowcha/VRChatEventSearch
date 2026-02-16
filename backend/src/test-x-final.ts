
import { scrapeX } from './scrapers/x';

async function main() {
    await scrapeX();
}

main().catch(console.error);
