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
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const USERNAME = process.env.TWITTER_USERNAME;
const PASSWORD = process.env.TWITTER_PASSWORD;
const EMAIL = process.env.TWITTER_EMAIL;
if (!USERNAME || !PASSWORD) {
    console.error('Please set TWITTER_USERNAME and TWITTER_PASSWORD in .env');
    process.exit(1);
}
function getCookies() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Launching browser to login to X...');
        const browser = yield puppeteer_1.default.launch({
            headless: false, // We need to see if challenges appear
            defaultViewport: { width: 1280, height: 800 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = yield browser.newPage();
        try {
            yield page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle0' });
            // Wait for username input
            console.log('Waiting for username input...');
            yield page.waitForSelector('input[autocomplete="username"]');
            yield page.type('input[autocomplete="username"]', USERNAME);
            // Click next
            const nextButton = yield page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => { var _a, _b; return ((_a = b.textContent) === null || _a === void 0 ? void 0 : _a.includes('Next')) || ((_b = b.textContent) === null || _b === void 0 ? void 0 : _b.includes('次へ')); });
                if (btn)
                    btn.click();
                return !!btn;
            });
            if (!nextButton) {
                // Fallback: try keypress Enter
                yield page.keyboard.press('Enter');
            }
            // Wait for password input or email challenge
            console.log('Waiting for password or email input...');
            // We might be asked for email or phone if suspicious
            yield new Promise(r => setTimeout(r, 2000));
            // Check for email input (unusual login activity)
            const isEmailChallenge = yield page.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                return inputs.some(i => i.name === 'text' || i.type === 'email'); // verify structure
            });
            // Specifically check if it's asking for phone/email which is distinct from password
            // Usually password input has name="password"
            let passwordInput = yield page.$('input[name="password"]');
            if (!passwordInput) {
                console.log('Password input not found immediately. Checking for challenge...');
                // Check for challenge input
                const challengeInput = yield page.$('input[name="text"], input[type="text"]');
                if (challengeInput && EMAIL) {
                    console.log('Challenge detected. Entering email...');
                    yield challengeInput.type(EMAIL);
                    yield page.keyboard.press('Enter');
                    yield new Promise(r => setTimeout(r, 2000));
                    passwordInput = yield page.$('input[name="password"]');
                }
                else {
                    console.log('No password input and no known challenge input found (or email missing).');
                }
            }
            if (passwordInput) {
                console.log('Entering password...');
                yield passwordInput.type(PASSWORD);
                yield page.keyboard.press('Enter');
            }
            else {
                console.error('Could not find password input.');
                yield page.screenshot({ path: 'login_fail.png' });
                return;
            }
            // Wait for login to complete
            console.log('Waiting for home page...');
            try {
                yield page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
            }
            catch (e) {
                // Sometimes navigation promise doesn't resolve if it's SPA transition
                console.log('Navigation timeout or SPA transition. Checking URL...');
            }
            yield new Promise(r => setTimeout(r, 3000));
            if (page.url().includes('home')) {
                console.log('Login successful!');
                const cookies = yield page.cookies();
                fs_1.default.writeFileSync('x-cookies.json', JSON.stringify(cookies, null, 2));
                console.log('Cookies saved to x-cookies.json');
            }
            else {
                console.log(`Current URL: ${page.url()}`);
                yield page.screenshot({ path: 'login_status.png' });
                const cookies = yield page.cookies();
                fs_1.default.writeFileSync('x-cookies.json', JSON.stringify(cookies, null, 2)); // Save anyway just in case
                console.log('Cookies saved (login might be incomplete).');
            }
        }
        catch (error) {
            console.error('Error getting cookies:', error);
            yield page.screenshot({ path: 'login_error.png' });
        }
        finally {
            yield browser.close();
        }
    });
}
getCookies();
//# sourceMappingURL=get-x-cookies.js.map