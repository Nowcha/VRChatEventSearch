
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const SEARCH_QUERY = '#VRChat_event';
const SEARCH_URL = `https://x.com/search?q=${encodeURIComponent(SEARCH_QUERY)}&src=typed_query&f=live`;

async function scrapeXWithCookies() {
    console.log('Starting X scrape with Puppeteer + Cookies...');

    const authToken = process.env.TWITTER_AUTH_TOKEN;
    const ct0 = process.env.TWITTER_CT0;

    if (!authToken || !ct0) {
        console.error('Missing cookies in .env');
        return;
    }

    const browser = await puppeteer.launch({
        headless: false, // Visible for debugging first
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        // Set cookies
        await page.setCookie(
            { name: 'auth_token', value: authToken, domain: '.x.com' },
            { name: 'ct0', value: ct0, domain: '.x.com' }
        );

        console.log('Cookies set. Navigating to Home to verify...');
        await page.goto('https://x.com/home', { waitUntil: 'networkidle2' });

        if (page.url().includes('login') || page.url().includes('g/flow')) { // Redirected to login
            console.log('Redirected to login! Cookies might be invalid or need more fields.');
            await page.screenshot({ path: 'x_redirect_login.png' });
        } else {
            console.log('Login seems successful (or at least not rejected). URL:', page.url());
        }

        console.log(`Navigating to search: ${SEARCH_URL}`);
        await page.goto(SEARCH_URL, { waitUntil: 'networkidle2' });

        await new Promise(r => setTimeout(r, 5000)); // Wait for content

        // Scrape tweets
        const tweets = await page.evaluate(() => {
            const articles = document.querySelectorAll('article[data-testid="tweet"]');
            const results: any[] = [];

            articles.forEach(article => {
                const textEl = article.querySelector('div[data-testid="tweetText"]');
                const timeEl = article.querySelector('time');
                const imgEl = article.querySelector('div[data-testid="tweetPhoto"] img');
                const userEl = article.querySelector('div[data-testid="User-Name"]');

                if (textEl) {
                    results.push({
                        text: textEl.textContent,
                        time: timeEl ? timeEl.getAttribute('datetime') : null,
                        img: imgEl ? imgEl.getAttribute('src') : null,
                        user: userEl ? userEl.textContent : null
                    });
                }
            });
            return results;
        });

        console.log(`Found ${tweets.length} tweets.`);
        tweets.forEach((t, i) => console.log(`${i}: ${t.user} - ${t.text?.substring(0, 30)}...`));

        await page.screenshot({ path: 'x_search_success.png' });

    } catch (error) {
        console.error('Error scraping X:', error);
    } finally {
        await browser.close();
    }
}

scrapeXWithCookies();
