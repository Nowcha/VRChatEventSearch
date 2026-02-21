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
exports.scrapeGoogleCalendar = scrapeGoogleCalendar;
const puppeteer_1 = __importDefault(require("puppeteer"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const CALENDAR_URL = 'https://calendar.google.com/calendar/embed?src=0058cd78d2936be61ca77f27b894c73bfae9f1f2aa778a762f0c872e834ee621%40group.calendar.google.com&mode=AGENDA';
function scrapeGoogleCalendar() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting Google Calendar scrape...');
        const browser = yield puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = yield browser.newPage();
        // Set viewport to ensure elements are visible/clickable
        yield page.setViewport({ width: 1280, height: 800 });
        try {
            yield page.goto(CALENDAR_URL, { waitUntil: 'networkidle0' });
            yield page.waitForSelector('.IcmSIe', { timeout: 10000 });
            // Phase 1: Collect all event elements first
            // We cannot click them inside a simple evaluate loop because navigation/popup changes DOM state.
            // So we get a handle to all event title elements.
            // Use the title/click target class we identified
            const ITEM_SELECTOR = '.URIUGf';
            const eventElements = yield page.$$(ITEM_SELECTOR);
            console.log(`Found ${eventElements.length} event elements. Processing sequentially...`);
            const eventsData = [];
            for (let i = 0; i < eventElements.length; i++) {
                // Re-query elements because DOM might have updated/detached
                const freshElements = yield page.$$(ITEM_SELECTOR);
                const el = freshElements[i];
                if (!el)
                    continue;
                try {
                    // 1. Get Basic Data (Title, Time) from the row *before* clicking (or from the click target itself)
                    // The structure is Row -> Time + Title. The 'el' is the Title <span>/div.
                    const basicInfo = yield page.evaluate((e) => {
                        const row = e.closest('.ryakYc'); // Event Row
                        const dayGroup = e.closest('.YOmXMd'); // Day Group containing the row
                        let dateRaw = '';
                        if (dayGroup) {
                            const dateHeader = dayGroup.querySelector('.XuJrye');
                            dateRaw = dateHeader ? (dateHeader.textContent || '').trim() : '';
                        }
                        let timeRaw = '';
                        if (row) {
                            const timeEl = row.querySelector('.JxNhxc');
                            timeRaw = timeEl ? (timeEl.textContent || '').trim() : '';
                        }
                        return {
                            title: (e.textContent || '').trim(),
                            dateRaw,
                            timeRaw
                        };
                    }, el);
                    // 2. Click to open details
                    yield el.click();
                    // 3. Wait for popup
                    // Selector '.MlTUt.DbQnIe' was found to be the description container.
                    // Also 'div[role="dialog"]' is the container.
                    // We wait for the close button to be sure it loaded.
                    const CLOSE_BTN_SEL = 'button[aria-label="閉じる"]';
                    try {
                        yield page.waitForSelector(CLOSE_BTN_SEL, { timeout: 3000 });
                    }
                    catch (timeout) {
                        console.warn(`Popup didn't open for ${basicInfo.title}, skipping details.`);
                        eventsData.push(Object.assign(Object.assign({}, basicInfo), { description: '' }));
                        continue;
                    }
                    // 4. Extract Description
                    // description is often in a specific div. properties like location might be separate.
                    const description = yield page.evaluate(() => {
                        // Try specific description class identified
                        const descEl = document.querySelector('.MlTUt.DbQnIe'); // identified class
                        if (descEl)
                            return descEl.textContent || '';
                        // Fallback: Get text from dialog but exclude title/time if possible
                        const dialog = document.querySelector('div[role="dialog"]');
                        return dialog ? (dialog.textContent || '') : '';
                    });
                    eventsData.push(Object.assign(Object.assign({}, basicInfo), { description: description.trim() }));
                    // 5. Close popup
                    yield page.click(CLOSE_BTN_SEL);
                    // Wait for popup to go away
                    yield page.waitForFunction((sel) => !document.querySelector(sel), {}, CLOSE_BTN_SEL);
                    // Small delay to stabilize
                    yield new Promise(r => setTimeout(r, 200));
                }
                catch (err) {
                    console.error(`Error processing event ${i}:`, err);
                }
            }
            console.log(`Processed ${eventsData.length} events.`);
            const currentYear = new Date().getFullYear();
            for (const ev of eventsData) {
                // console.log(`Upserting: ${ev.title}`);
                // --- Date/Time Parsing (Same as before) ---
                const dateMatch = ev.dateRaw ? ev.dateRaw.match(/(\d{1,2})月\s*(\d{1,2})日/) : null;
                if (!dateMatch) {
                    // console.log('Skipping event due to date parse failure:', ev.dateRaw);
                    continue;
                }
                const month = parseInt(dateMatch[1]);
                const day = parseInt(dateMatch[2]);
                let startTime = new Date(currentYear, month - 1, day);
                let endTime = null;
                if (ev.timeRaw && ev.timeRaw !== '終日') {
                    let timeStr = ev.timeRaw.replace(/～/g, '-').replace(/\s+/g, '');
                    const parts = timeStr.split('-');
                    if (parts.length > 0) {
                        const startHmM = parts[0].match(/(\d{1,2}):(\d{2})/);
                        if (startHmM) {
                            startTime.setHours(parseInt(startHmM[1]), parseInt(startHmM[2]), 0, 0);
                            if (parts.length > 1) {
                                const endHmM = parts[1].match(/(\d{1,2}):(\d{2})/);
                                if (endHmM) {
                                    endTime = new Date(currentYear, month - 1, day);
                                    endTime.setHours(parseInt(endHmM[1]), parseInt(endHmM[2]), 0, 0);
                                    if (endTime < startTime) {
                                        endTime.setDate(endTime.getDate() + 1);
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    startTime.setHours(0, 0, 0, 0);
                }
                // ------------------------------------------
                const uniqueKey = `${ev.title}_${startTime.toISOString()}`;
                yield prisma.event.upsert({
                    where: {
                        source_externalId: {
                            source: 'google-calendar',
                            externalId: uniqueKey
                        }
                    },
                    update: {
                        startTime,
                        endTime,
                        description: ev.description, // Update description!
                        updatedAt: new Date()
                    },
                    create: {
                        source: 'google-calendar',
                        externalId: uniqueKey,
                        title: ev.title,
                        startTime,
                        endTime,
                        description: ev.description // Insert description!
                    }
                });
            }
        }
        catch (error) {
            console.error('Error scraping Google Calendar:', error);
        }
        finally {
            yield browser.close();
            yield prisma.$disconnect();
        }
    });
}
//# sourceMappingURL=google-calendar.js.map