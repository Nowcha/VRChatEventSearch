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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio = __importStar(require("cheerio"));
const fs_1 = __importDefault(require("fs"));
const html = fs_1.default.readFileSync('structure.html', 'utf8');
const $ = cheerio.load(html);
let output = '';
output += '--- Event Titles (.URIUGf) ---\n';
$('.URIUGf').slice(0, 10).each((i, el) => {
    const $el = $(el);
    output += `[${i}] Text: ${$el.text().trim()}\n`;
    output += `    Parent: ${$el.parent().attr('class')}\n`;
    output += `    Grandparent: ${$el.parent().parent().attr('class')}\n`;
});
output += '\n--- Event Times (.JxNhxc) ---\n';
$('.JxNhxc').slice(0, 10).each((i, el) => {
    const $el = $(el);
    output += `[${i}] Text: ${$el.text().trim()}\n`;
    output += `    Parent: ${$el.parent().attr('class')}\n`;
    output += `    Grandparent: ${$el.parent().parent().attr('class')}\n`;
});
output += '\n--- Date Headers? ---\n';
// Look for elements with date-like text
$('*').each((i, el) => {
    // Only text nodes
    const $el = $(el);
    const text = $el.children().length === 0 ? $el.text().trim() : '';
    if (text.match(/^\d{1,2}月\s*\d{1,2}日/)) {
        output += `Found Date: "${text}" in ${el.tagName}.${$(el).attr('class')} (Parent: ${$el.parent().attr('class')})\n`;
    }
});
fs_1.default.writeFileSync('analysis_specific.txt', output, 'utf8');
console.log('Analysis saved to analysis_specific.txt');
//# sourceMappingURL=analyze-structure.js.map