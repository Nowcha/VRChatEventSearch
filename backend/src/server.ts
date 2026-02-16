import express, { Request, Response } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { scrapeGoogleCalendar } from './scrapers/google-calendar';
import { scrapeX } from './scrapers/x';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Endpoints
app.get('/api/events', async (req: Request, res: Response) => {
    try {
        const { start, end } = req.query;
        const events = await prisma.event.findMany({
            where: {
                startTime: {
                    gte: start ? new Date(start as string) : undefined,
                    lte: end ? new Date(end as string) : undefined,
                },
            },
        });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Manual Trigger for Scraper (for debugging)
app.post('/api/scrape', async (req: Request, res: Response) => {
    try {
        console.log('Starting manual scrape...');
        // Run asynchronously to not block response
        (async () => {
            console.log('Triggering Google Calendar scraper...');
            await scrapeGoogleCalendar();
            console.log('Triggering X scraper...');
            await scrapeX();
            console.log('Manual scrape finished.');
        })();

        res.json({ message: 'Scraping started in background' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Scraping failed' });
    }
});

// Daily Cron Job (17:00 JST)
cron.schedule('0 17 * * *', async () => {
    console.log('Running daily scrape job (17:00 JST)...');
    try {
        console.log('Triggering Google Calendar scraper...');
        await scrapeGoogleCalendar();
        console.log('Triggering X scraper...');
        await scrapeX();
        console.log('Daily scrape finished.');
    } catch (e) {
        console.error('Error in daily scrape job:', e);
    }
}, {
    timezone: "Asia/Tokyo"
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
