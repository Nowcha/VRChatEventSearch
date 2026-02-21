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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const google_calendar_1 = require("./scrapers/google-calendar");
const x_1 = require("./scrapers/x");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3002;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// API Endpoints
// API Endpoints
app.get('/api/events', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { start, end, ids } = req.query;
        console.log('GET /api/events params:', { start, end, ids });
        let whereClause = {};
        if (ids) {
            const idList = ids.split(',');
            whereClause = {
                id: { in: idList }
            };
        }
        else {
            whereClause = {
                startTime: {
                    gte: start ? new Date(start) : undefined,
                    lte: end ? new Date(end) : undefined,
                },
            };
        }
        const events = yield prisma.event.findMany({
            where: whereClause,
        });
        res.json(events);
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
}));
// Batch fetch events by IDs (to avoid URL length limits)
app.post('/api/events/batch', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            res.status(400).json({ error: 'Invalid or missing ids array' });
            return;
        }
        const events = yield prisma.event.findMany({
            where: {
                id: { in: ids }
            },
        });
        res.json(events);
    }
    catch (error) {
        console.error('Error batch fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events batch' });
    }
}));
// Manual Trigger for Scraper (for debugging)
app.post('/api/scrape', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Starting manual scrape...');
        // Run asynchronously to not block response
        (() => __awaiter(void 0, void 0, void 0, function* () {
            console.log('Triggering Google Calendar scraper...');
            yield (0, google_calendar_1.scrapeGoogleCalendar)();
            console.log('Triggering X scraper...');
            yield (0, x_1.scrapeX)();
            console.log('Manual scrape finished.');
        }))();
        res.json({ message: 'Scraping started in background' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Scraping failed' });
    }
}));
// Daily Cron Job (17:00 JST)
node_cron_1.default.schedule('0 17 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Running daily scrape job (17:00 JST)...');
    try {
        console.log('Triggering Google Calendar scraper...');
        yield (0, google_calendar_1.scrapeGoogleCalendar)();
        console.log('Triggering X scraper...');
        yield (0, x_1.scrapeX)();
        // Data Retention: Delete events older than 9 days
        const nineDaysAgo = new Date();
        nineDaysAgo.setDate(nineDaysAgo.getDate() - 9);
        const deleted = yield prisma.event.deleteMany({
            where: {
                startTime: {
                    lt: nineDaysAgo
                }
            }
        });
        console.log(`Data retention cleanup: Deleted ${deleted.count} events older than 9 days.`);
        console.log('Daily scrape finished.');
    }
    catch (e) {
        console.error('Error in daily scrape job:', e);
    }
}), {
    timezone: "Asia/Tokyo"
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map