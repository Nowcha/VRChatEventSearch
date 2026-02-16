
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const SEARCH_QUERY = '#VRChat_event min_faves:5'; // Add filter to reduce noise? Or just #VRChat_event
// Note: "Live" tab might be better for events, "Top" for popular ones.
const SEARCH_URL = `https://x.com/search?q=${encodeURIComponent('#VRChat_event')}&src=typed_query&f=live`;

export async function scrapeX() {
    console.log('Starting X scrape...');

    const authToken = process.env.TWITTER_AUTH_TOKEN;
    const ct0 = process.env.TWITTER_CT0;

    if (!authToken || !ct0) {
        console.error('Missing TWITTER_AUTH_TOKEN or TWITTER_CT0 in .env');
        return;
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport for better loading
    await page.setViewport({ width: 1280, height: 800 });

    try {
        await page.setCookie(
            { name: 'auth_token', value: authToken, domain: '.x.com' },
            { name: 'ct0', value: ct0, domain: '.x.com' }
        );

        await page.goto(SEARCH_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for tweets to load
        try {
            await page.waitForSelector('article[data-testid="tweet"]', { timeout: 15000 });
        } catch (e) {
            console.log('Timeout waiting for tweets. Possibly no results or login issue.');
            await page.screenshot({ path: 'x_scrape_timeout.png' });
            return;
        }

        // Scroll a bit to trigger lazy load (optional, for now just first batch)
        await page.evaluate(() => window.scrollBy(0, 1000));
        await new Promise(r => setTimeout(r, 2000));

        const tweets = await page.evaluate(() => {
            const articles = document.querySelectorAll('article[data-testid="tweet"]');
            const results: any[] = [];

            articles.forEach(article => {
                try {
                    const textEl = article.querySelector('div[data-testid="tweetText"]');
                    const timeEl = article.querySelector('time');
                    const imgEl = article.querySelector('div[data-testid="tweetPhoto"] img');
                    const userEl = article.querySelector('div[data-testid="User-Name"]');

                    // Link: search for a link that has /status/ in href
                    const links = Array.from(article.querySelectorAll('a'));
                    const statusLink = links.find(a => a.href.includes('/status/'));

                    if (textEl) {
                        results.push({
                            text: textEl.textContent,
                            dateTime: timeEl ? timeEl.getAttribute('datetime') : null,
                            imgUrl: imgEl ? imgEl.getAttribute('src') : null,
                            user: userEl ? userEl.textContent : null,
                            url: statusLink ? statusLink.href : null
                        });
                    }
                } catch (err) {
                    // ignore individual tweet error
                }
            });
            return results;
        });

        console.log(`Found ${tweets.length} tweets.`);

        for (const t of tweets) {
            // Processing
            // We need a unique ID. URL is best.
            // If URL is missing, skip.
            if (!t.url) continue;

            const externalId = t.url;

            // Date parsing
            // t.dateTime should be ISO string if from <time datetime="...">
            let startTime = t.dateTime ? new Date(t.dateTime) : new Date();

            // If image is present, usually good for event
            // Filter: maybe only tweets with images?
            // User requested "Extract image, text".

            await prisma.event.upsert({
                where: {
                    source_externalId: {
                        source: 'x',
                        externalId: externalId
                    }
                },
                update: {
                    updatedAt: new Date(),
                    imageUrl: t.imgUrl, // update image if changed
                    description: t.text
                },
                create: {
                    source: 'x',
                    externalId: externalId,
                    title: `Event by ${t.user || 'Unknown'}`, // X doesn't have titles, use User or truncate text?
                    description: t.text || '',
                    startTime: startTime,
                    // endTime? Hard to guess.
                    // location? Hard to guess.
                    url: t.url,
                    imageUrl: t.imgUrl
                }
            });
            console.log(`Upserted X event: ${externalId}`);
        }

    } catch (error) {
        console.error('Error scraping X:', error);
        await page.screenshot({ path: 'x_scrape_error.png' });
    } finally {
        await browser.close();
        await prisma.$disconnect();
    }
}
