// Test single case
const { checkAdditionalNightsAvailable } = require('./index');

const testInput = {
    "selectedDate": "2025-11-30",
    "additionalNights": 1,
    "isChangeRequest": true,
    "currentBooking": {"checkIn": "2025-12-21", "checkout": "2025-12-23"},
    "allBookings": [{
    "checkIn": "2025-12-21",
    "checkout": "2025-12-23"
},{
    "checkIn": "2025-12-21",
    "checkout": "2025-12-23"
}],
    "userBooking": [{
    "checkIn": "2025-12-01",
    "checkout": "2025-12-05"
},{
    "checkIn": "2025-12-21",
    "checkout": "2025-12-23"
}],
    "daysAvailableToHost": ["Wednesday","Monday","Sunday","Saturday","Thursday","Tuesday","Friday"],
    "futureDays": 365,
    "sameDayBooking": false,
    "daysInAdvance": 1
};

console.log('Running test case...');
const result = checkAdditionalNightsAvailable(testInput);
console.log('Result:', result);
