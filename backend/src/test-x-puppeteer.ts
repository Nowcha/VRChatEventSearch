
import puppeteer from 'puppeteer';

const SEARCH_URL = 'https://x.com/search?q=%23VRChat_event&src=typed_query&f=live';

async function scrapeX() {
    console.log('Starting X scrape check...');
    const browser = await puppeteer.launch({
        headless: false, // Non-headless to see if login wall hits
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.goto(SEARCH_URL, { waitUntil: 'networkidle2' });

        // Wait and see if we get content or login wall
        await new Promise(resolve => setTimeout(resolve, 5000));

        const content = await page.content();
        if (content.includes('Sign in to X') || content.includes('Log in')) {
            console.log('Login wall detected.');
        } else {
            console.log('Login wall NOT immediately detected (or different text).');
        }

        await page.screenshot({ path: 'x_search_check.png' });
        console.log('Screenshot saved to x_search_check.png');

    } catch (error) {
        console.error('Error scraping X:', error);
    } finally {
        await browser.close();
    }
}

scrapeX();
