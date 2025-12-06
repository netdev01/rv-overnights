// Test single case
const { checkAdditionalNightsAvailable } = require('./index');

const testInput = {
    "space": 1, 
    "selectedDate": "2026-11-16",
    "additionalNights": 3,
    "isChangeRequest": true,
    "currentBooking": {"checkIn": "2025-12-15", "checkout": "2025-12-17"},
    "allBookings": [{
    "checkIn": "2025-12-01", 
    "checkout": "2025-12-05"
},{
    "checkIn": "2025-11-20", 
    "checkout": "2025-11-21"
},{
    "checkIn": "2025-12-10", 
    "checkout": "2025-12-11"
},{
    "checkIn": "2025-12-15", 
    "checkout": "2025-12-17"
},{
    "checkIn": "2025-12-27", 
    "checkout": "2025-12-27"
}],
    "userBooking": [{
    "checkIn": "2025-12-01", 
    "checkout": "2025-12-05"
},{
    "checkIn": "2025-12-15", 
    "checkout": "2025-12-17"
}],
    "daysAvailableToHost": ["Wednesday","Monday","Thursday","Tuesday","Friday","Saturday"],
    "futureDays": 365,
    "sameDayBooking": false,
    "daysInAdvance": 1,
    "blockedYearly": [{
   "spaces": [1],
    "start": "2025-11-13", 
    "end": "2025-11-14"
},{
   "spaces": [1],
    "start": "2025-11-20", 
    "end": "2025-11-21"
},{
   "spaces": [1],
    "start": "2025-12-10", 
    "end": "2025-12-11"
}],
    "blockedNoYearly": [{
   "spaces": [1, 2],
    "start": "2025-12-27", 
    "end": "2025-12-27"
}]
};

console.log('Running test case...');
const result = checkAdditionalNightsAvailable(testInput);
console.log('Result:', result);
