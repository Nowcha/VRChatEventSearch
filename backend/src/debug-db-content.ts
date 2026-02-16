
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEventDescriptions() {
    const events = await prisma.event.findMany({
        take: 5,
        orderBy: { startTime: 'desc' },
        select: {
            title: true,
            description: true,
            source: true
        }
    });

    console.log('--- Database Event Content (Latest 5) ---');
    events.forEach(e => {
        console.log(`[${e.source}] ${e.title}`);
        console.log('Description:', e.description ? e.description.substring(0, 200) + '...' : '(null or empty)');
        console.log('-----------------------------------------');
    });
}

checkEventDescriptions()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
