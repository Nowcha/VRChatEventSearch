
import puppeteer from 'puppeteer';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const USERNAME = process.env.TWITTER_USERNAME;
const PASSWORD = process.env.TWITTER_PASSWORD;
const EMAIL = process.env.TWITTER_EMAIL;

if (!USERNAME || !PASSWORD) {
    console.error('Please set TWITTER_USERNAME and TWITTER_PASSWORD in .env');
    process.exit(1);
}

async function getCookies() {
    console.log('Launching browser to login to X...');
    const browser = await puppeteer.launch({
        headless: false, // We need to see if challenges appear
        defaultViewport: { width: 1280, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle0' });

        // Wait for username input
        console.log('Waiting for username input...');
        await page.waitForSelector('input[autocomplete="username"]');
        await page.type('input[autocomplete="username"]', USERNAME!);

        // Click next
        const nextButton = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.textContent?.includes('Next') || b.textContent?.includes('次へ'));
            if (btn) btn.click();
            return !!btn;
        });

        if (!nextButton) {
            // Fallback: try keypress Enter
            await page.keyboard.press('Enter');
        }

        // Wait for password input or email challenge
        console.log('Waiting for password or email input...');
        // We might be asked for email or phone if suspicious

        await new Promise(r => setTimeout(r, 2000));

        // Check for email input (unusual login activity)
        const isEmailChallenge = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            return inputs.some(i => i.name === 'text' || i.type === 'email'); // verify structure
        });

        // Specifically check if it's asking for phone/email which is distinct from password
        // Usually password input has name="password"

        let passwordInput = await page.$('input[name="password"]');

        if (!passwordInput) {
            console.log('Password input not found immediately. Checking for challenge...');
            // Check for challenge input
            const challengeInput = await page.$('input[name="text"], input[type="text"]');
            if (challengeInput && EMAIL) {
                console.log('Challenge detected. Entering email...');
                await challengeInput.type(EMAIL);
                await page.keyboard.press('Enter');
                await new Promise(r => setTimeout(r, 2000));
                passwordInput = await page.$('input[name="password"]');
            } else {
                console.log('No password input and no known challenge input found (or email missing).');
            }
        }

        if (passwordInput) {
            console.log('Entering password...');
            await passwordInput.type(PASSWORD!);
            await page.keyboard.press('Enter');
        } else {
            console.error('Could not find password input.');
            await page.screenshot({ path: 'login_fail.png' });
            return;
        }

        // Wait for login to complete
        console.log('Waiting for home page...');
        try {
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        } catch (e) {
            // Sometimes navigation promise doesn't resolve if it's SPA transition
            console.log('Navigation timeout or SPA transition. Checking URL...');
        }

        await new Promise(r => setTimeout(r, 3000));

        if (page.url().includes('home')) {
            console.log('Login successful!');
            const cookies = await page.cookies();
            fs.writeFileSync('x-cookies.json', JSON.stringify(cookies, null, 2));
            console.log('Cookies saved to x-cookies.json');
        } else {
            console.log(`Current URL: ${page.url()}`);
            await page.screenshot({ path: 'login_status.png' });
            const cookies = await page.cookies();
            fs.writeFileSync('x-cookies.json', JSON.stringify(cookies, null, 2)); // Save anyway just in case
            console.log('Cookies saved (login might be incomplete).');
        }

    } catch (error) {
        console.error('Error getting cookies:', error);
        await page.screenshot({ path: 'login_error.png' });
    } finally {
        await browser.close();
    }
}

getCookies();
