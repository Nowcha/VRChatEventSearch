import { scrapeVrceve } from './scrapers/vrceve';

async function main() {
    console.log('Testing vrceve scraper...');
    await scrapeVrceve();
    console.log('Done.');
}

main().catch(console.error);
