"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.scrapeVrceve = scrapeVrceve;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const API_URL = 'https://vrceve.com/wp-json/wp/v2/posts';
function scrapeVrceve() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Fetching events from vrceve.com API...');
            // Fetch recent posts (maybe 20 for test)
            const response = yield axios_1.default.get(API_URL, {
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
                    yield prisma.event.upsert({
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
                }
                catch (e) {
                    console.error(`Failed to upsert event ${externalId}:`, e);
                }
            }
            console.log('vrceve.com scraping completed.');
        }
        catch (error) {
            console.error('Error scraping vrceve.com:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
//# sourceMappingURL=vrceve.js.map