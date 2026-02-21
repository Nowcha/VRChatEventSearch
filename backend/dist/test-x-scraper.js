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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const agent_twitter_client_1 = require("agent-twitter-client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        var _d;
        const scraper = new agent_twitter_client_1.Scraper();
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
            yield scraper.setCookies(cookieStrings);
            console.log('Cookies set.');
            console.log('Attempting to search tweets...');
            // Standard search
            const tweets = yield scraper.fetchSearchTweets('#VRChat_event', 20, "Latest");
            let count = 0;
            try {
                for (var _e = true, tweets_1 = __asyncValues(tweets), tweets_1_1; tweets_1_1 = yield tweets_1.next(), _a = tweets_1_1.done, !_a; _e = true) {
                    _c = tweets_1_1.value;
                    _e = false;
                    const tweet = _c;
                    console.log(`- @${tweet.username}: ${(_d = tweet.text) === null || _d === void 0 ? void 0 : _d.substring(0, 50)}...`);
                    if (tweet.photos && tweet.photos.length > 0) {
                        console.log(`  Image: ${tweet.photos[0].url}`);
                    }
                    count++;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_e && !_a && (_b = tweets_1.return)) yield _b.call(tweets_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            console.log(`Found ${count} tweets.`);
        }
        catch (error) {
            console.error('Error scraping X:', error);
        }
    });
}
main();
//# sourceMappingURL=test-x-scraper.js.map