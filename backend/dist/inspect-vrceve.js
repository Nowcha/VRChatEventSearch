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
const axios_1 = __importDefault(require("axios"));
const CALENDAR_ID = '0058cd78d2936be61ca77f27b894c73bfae9f1f2aa778a762f0c872e834ee621@group.calendar.google.com';
const ICAL_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;
function checkGoogleIcal() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Checking Google Calendar iCal: ${ICAL_URL}`);
            const res = yield axios_1.default.get(ICAL_URL, {
                validateStatus: (status) => status < 400
            });
            console.log(`Status: ${res.status}`);
            if (res.data.includes('BEGIN:VCALENDAR')) {
                console.log('SUCCESS: Found Google iCal feed!');
                console.log(res.data.substring(0, 500)); // Print header
            }
            else {
                console.log('Not a valid iCal feed.');
            }
        }
        catch (e) {
            console.error(`Error: ${e.message}`);
        }
    });
}
checkGoogleIcal();
//# sourceMappingURL=inspect-vrceve.js.map