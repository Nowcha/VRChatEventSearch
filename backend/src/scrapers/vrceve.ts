import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'https://vrceve.com/wp-json/wp/v2/posts';

export async function scrapeVrceve() {
    try {
        console.log('Fetching events from vrceve.com API...');
        // Fetch recent posts (maybe 20 for test)
        const response = await axios.get(API_URL, {
            params: {
                per_page: 20,
                _fields: 'id,date,title,content,link,featured_media'
            }
        });

        const posts = response.data;
        console.log(`Found ${posts.length} posts.`);

        for (const post of posts) {
            const externalId = post.id.toString();
            const title = post.title.rendered;
            const contentHtml = post.content.rendered;
            const link = post.link;
            const date = new Date(post.date);

            // Extract details from HTML using cheerio if needed
            const $ = cheerio.load(contentHtml);
            // For now, simple text extraction for description
            let description = $.text().trim();
            if (description.length > 500) {
                description = description.substring(0, 500) + '...';
            }

            // Check for unique constraint conflict or update
            // The schema has @@unique([source, externalId])
            // Prisma compound unique where clause uses: source_externalId

            try {
                await prisma.event.upsert({
                    where: {
                        source_externalId: {
                            source: 'vrceve',
                            externalId: externalId
                        }
                    },
                    update: {
                        title,
                        description,
                        startTime: date,
                        url: link,
                        updatedAt: new Date()
                    },
                    create: {
                        source: 'vrceve',
                        externalId,
                        title,
                        description,
                        startTime: date,
                        url: link
                    }
                });
                console.log(`Upserted event: ${title}`);
            } catch (e) {
                console.error(`Failed to upsert event ${externalId}:`, e);
            }
        }
        console.log('vrceve.com scraping completed.');

    } catch (error) {
        console.error('Error scraping vrceve.com:', error);
    } finally {
        await prisma.$disconnect();
    }
}
