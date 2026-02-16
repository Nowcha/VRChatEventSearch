
import axios from 'axios';

const CALENDAR_ID = '0058cd78d2936be61ca77f27b894c73bfae9f1f2aa778a762f0c872e834ee621@group.calendar.google.com';
const ICAL_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

async function checkGoogleIcal() {
    try {
        console.log(`Checking Google Calendar iCal: ${ICAL_URL}`);
        const res = await axios.get(ICAL_URL, {
            validateStatus: (status) => status < 400
        });
        console.log(`Status: ${res.status}`);
        if (res.data.includes('BEGIN:VCALENDAR')) {
            console.log('SUCCESS: Found Google iCal feed!');
            console.log(res.data.substring(0, 500)); // Print header
        } else {
            console.log('Not a valid iCal feed.');
        }
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

checkGoogleIcal();
