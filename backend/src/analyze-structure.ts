
import * as cheerio from 'cheerio';
import fs from 'fs';

const html = fs.readFileSync('structure.html', 'utf8');
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

fs.writeFileSync('analysis_specific.txt', output, 'utf8');
console.log('Analysis saved to analysis_specific.txt');
