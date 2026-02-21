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
const SEARCH_URL = 'https://x.com/search?q=%23VRChat_event&src=typed_query&f=live';
function scrapeX() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting X scrape check...');
        const browser = yield puppeteer_1.default.launch({
            headless: false, // Non-headless to see if login wall hits
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = yield browser.newPage();
        try {
            yield page.goto(SEARCH_URL, { waitUntil: 'networkidle2' });
            // Wait and see if we get content or login wall
            yield new Promise(resolve => setTimeout(resolve, 5000));
            const content = yield page.content();
            if (content.includes('Sign in to X') || content.includes('Log in')) {
                console.log('Login wall detected.');
            }
            else {
                console.log('Login wall NOT immediately detected (or different text).');
            }
            yield page.screenshot({ path: 'x_search_check.png' });
            console.log('Screenshot saved to x_search_check.png');
        }
        catch (error) {
            console.error('Error scraping X:', error);
        }
        finally {
            yield browser.close();
        }
    });
}
scrapeX();
//# sourceMappingURL=test-x-puppeteer.js.map