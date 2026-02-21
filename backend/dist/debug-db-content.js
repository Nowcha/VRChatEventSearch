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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function checkEventDescriptions() {
    return __awaiter(this, void 0, void 0, function* () {
        const events = yield prisma.event.findMany({
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
    });
}
checkEventDescriptions()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=debug-db-content.js.map