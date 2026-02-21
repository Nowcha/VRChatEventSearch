"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SEARCH_QUERY = '#VRChat_event';
const SEARCH_URL = `https://x.com/search?q=${encodeURIComponent(SEARCH_QUERY)}&src=typed_query&f=live`;
function scrapeXWithCookies() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting X scrape with Puppeteer + Cookies...');
        const authToken = process.env.TWITTER_AUTH_TOKEN;
        const ct0 = process.env.TWITTER_CT0;
        if (!authToken || !ct0) {
            console.error('Missing cookies in .env');
            return;
        }
        const browser = yield puppeteer_1.default.launch({
            headless: false, // Visible for debugging first
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = yield browser.newPage();
        try {
            // Set cookies
            yield page.setCookie({ name: 'auth_token', value: authToken, domain: '.x.com' }, { name: 'ct0', value: ct0, domain: '.x.com' });
            console.log('Cookies set. Navigating to Home to verify...');
            yield page.goto('https://x.com/home', { waitUntil: 'networkidle2' });
            if (page.url().includes('login') || page.url().includes('g/flow')) { // Redirected to login
                console.log('Redirected to login! Cookies might be invalid or need more fields.');
                yield page.screenshot({ path: 'x_redirect_login.png' });
            }
            else {
                console.log('Login seems successful (or at least not rejected). URL:', page.url());
            }
            console.log(`Navigating to search: ${SEARCH_URL}`);
            yield page.goto(SEARCH_URL, { waitUntil: 'networkidle2' });
            yield new Promise(r => setTimeout(r, 5000)); // Wait for content
            // Scrape tweets
            const tweets = yield page.evaluate(() => {
                const articles = document.querySelectorAll('article[data-testid="tweet"]');
                const results = [];
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
            tweets.forEach((t, i) => { var _a; return console.log(`${i}: ${t.user} - ${(_a = t.text) === null || _a === void 0 ? void 0 : _a.substring(0, 30)}...`); });
            yield page.screenshot({ path: 'x_search_success.png' });
        }
        catch (error) {
            console.error('Error scraping X:', error);
        }
        finally {
            yield browser.close();
        }
    });
}
scrapeXWithCookies();
//# sourceMappingURL=test-x-puppeteer-cookies.js.map