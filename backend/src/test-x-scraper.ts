
import { Scraper } from 'agent-twitter-client';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const scraper = new Scraper();

    try {
        console.log('Setting cookies for X...');
        const authToken = process.env.TWITTER_AUTH_TOKEN;
        const ct0 = process.env.TWITTER_CT0;

        if (!authToken || !ct0) {
            throw new Error('Missing TWITTER_AUTH_TOKEN or TWITTER_CT0 in .env');
        }

        // Try just the strings again, but ensure they are strings.
        // The error might be because we passed objects last time?
        // Wait, the previous error was s.replace is not a function.
        // If s is supposed to be a string, and we passed an object, that explains it.
        // If we passed strings and it failed...

        // Let's try to construct the array of strings as the library likely uses them for headers.
        const cookieStrings = [
            `auth_token=${authToken}`,
            `ct0=${ct0}`
        ];

        await scraper.setCookies(cookieStrings);
        console.log('Cookies set.');

        console.log('Attempting to search tweets...');
        // Standard search
        const tweets = await scraper.fetchSearchTweets('#VRChat_event', 20, "Latest");

        let count = 0;
        for await (const tweet of tweets) {
            console.log(`- @${tweet.username}: ${tweet.text?.substring(0, 50)}...`);
            if (tweet.photos && tweet.photos.length > 0) {
                console.log(`  Image: ${tweet.photos[0].url}`);
            }
            count++;
        }
        console.log(`Found ${count} tweets.`);

    } catch (error) {
        console.error('Error scraping X:', error);
    }
}

main();
