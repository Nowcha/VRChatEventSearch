
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CALENDAR_URL = 'https://calendar.google.com/calendar/embed?src=0058cd78d2936be61ca77f27b894c73bfae9f1f2aa778a762f0c872e834ee621%40group.calendar.google.com&mode=AGENDA';

export async function scrapeGoogleCalendar() {
    console.log('Starting Google Calendar scrape...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport to ensure elements are visible/clickable
    await page.setViewport({ width: 1280, height: 800 });

    try {
        await page.goto(CALENDAR_URL, { waitUntil: 'networkidle0' });
        await page.waitForSelector('.IcmSIe', { timeout: 10000 });

        // Phase 1: Collect all event elements first
        // We cannot click them inside a simple evaluate loop because navigation/popup changes DOM state.
        // So we get a handle to all event title elements.

        // Use the title/click target class we identified
        const ITEM_SELECTOR = '.URIUGf';
        const eventElements = await page.$$(ITEM_SELECTOR);
        console.log(`Found ${eventElements.length} event elements. Processing sequentially...`);

        const eventsData: any[] = [];

        for (let i = 0; i < eventElements.length; i++) {
            // Re-query elements because DOM might have updated/detached
            const freshElements = await page.$$(ITEM_SELECTOR);
            const el = freshElements[i];

            if (!el) continue;

            try {
                // 1. Get Basic Data (Title, Time) from the row *before* clicking (or from the click target itself)
                // The structure is Row -> Time + Title. The 'el' is the Title <span>/div.
                const basicInfo = await page.evaluate((e) => {
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
                await el.click();

                // 3. Wait for popup
                // Selector '.MlTUt.DbQnIe' was found to be the description container.
                // Also 'div[role="dialog"]' is the container.
                // We wait for the close button to be sure it loaded.
                const CLOSE_BTN_SEL = 'button[aria-label="閉じる"]';
                try {
                    await page.waitForSelector(CLOSE_BTN_SEL, { timeout: 3000 });
                } catch (timeout) {
                    console.warn(`Popup didn't open for ${basicInfo.title}, skipping details.`);
                    eventsData.push({ ...basicInfo, description: '' });
                    continue;
                }

                // 4. Extract Description
                // description is often in a specific div. properties like location might be separate.
                const description = await page.evaluate(() => {
                    // Try specific description class identified
                    const descEl = document.querySelector('.MlTUt.DbQnIe'); // identified class
                    if (descEl) return descEl.textContent || '';

                    // Fallback: Get text from dialog but exclude title/time if possible
                    const dialog = document.querySelector('div[role="dialog"]');
                    return dialog ? (dialog.textContent || '') : '';
                });

                eventsData.push({
                    ...basicInfo,
                    description: description.trim()
                });

                // 5. Close popup
                await page.click(CLOSE_BTN_SEL);

                // Wait for popup to go away
                await page.waitForFunction((sel) => !document.querySelector(sel), {}, CLOSE_BTN_SEL);

                // Small delay to stabilize
                await new Promise(r => setTimeout(r, 200));

            } catch (err) {
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
            let endTime: Date | null = null;

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
            } else {
                startTime.setHours(0, 0, 0, 0);
            }
            // ------------------------------------------

            const uniqueKey = `${ev.title}_${startTime.toISOString()}`;

            await prisma.event.upsert({
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

    } catch (error) {
        console.error('Error scraping Google Calendar:', error);
    } finally {
        await browser.close();
        await prisma.$disconnect();
    }
}
