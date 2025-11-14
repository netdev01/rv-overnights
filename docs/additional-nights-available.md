# Additional Nights Available

This script determines if additional nights are available for booking based on various constraints and existing bookings.

## Overview

The `scripts/additional-nights-available/index.js` script is designed for Bubble.io's server-side JavaScript actions. It checks if a specified number of additional nights can be booked starting from a selected date, considering existing bookings, hosting availability, and booking policies.

The function accepts input as either a JavaScript object or a JSON string, making it compatible with various environments including Bubble.io where data may be passed as stringified JSON.

## Input Parameters

The script accepts a JSON object with the following properties:

- **selectedDate** (string): The starting date for additional nights in YYYY-MM-DD format
- **additionalNights** (number): The number of additional nights beyond the selectedDate to check for availability (integer). Total nights checked = additionalNights + 1.
- **isChangeRequest** (boolean): Whether this is a change request for existing booking (true/false). If true, the `currentBooking` parameter must be provided to identify the original booking to exclude from conflict checking
- **currentBooking** (object): Required when `isChangeRequest` is true. An object with `checkIn` and `checkout` properties (YYYY-MM-DD format) representing the original booking dates to exclude from conflict checking
- **allBookings** (array): List of existing future booking ranges, each as an object with `checkIn` and `checkout` properties (YYYY-MM-DD format)
- **userBooking** (array): List of current user's future booking ranges, each as an object with `checkIn` and `checkout` properties (YYYY-MM-DD format)
- **daysAvailableToHost** (array): List of days of the week when hosting is available (e.g., ["Monday", "Tuesday", "Wednesday"])
- **futureDays** (number): Maximum number of days in the future that can be booked (integer)
- **sameDayBooking** (boolean): Whether same-day bookings are allowed (true/false)
- **daysInAdvance** (number): Minimum number of days required in advance for booking (integer)
- **blockedYearly** (array): Optional array of "MM/DD" strings for yearly blocked dates (e.g., ["10/01", "12/25"])
- **blockedNoYearly** (array): Optional array of "MM/DD/YY" strings for specific non-yearly blocked dates (e.g., ["10/01/25", "12/25/25"])

## Output

Returns a JSON object with:
- **status** (boolean): `true` if all additional nights are available, `false` otherwise
- **message** (string): User-friendly message (e.g., for date blocking: "Date blocked: YYYY-MM-DD"). Empty on success or general errors.
- **errorMessage** (string): Technical details and validation errors. Empty on success.

**Note**: The JSON object return format `{status, errorMessage}` is a requirement for Bubble.io Toolbox's Server Script action.

## Business Logic

The script validates availability by checking:

1. **Date Range Validity**: Ensures the selected date and additional nights don't exceed future booking limits
2. **Advance Booking Requirements**: Checks if booking is made with sufficient notice
3. **Same-Day Booking Policy**: Respects same-day booking restrictions
4. **Day-of-Week Availability**: Only allows booking on specified hosting days
5. **Existing Bookings**: Prevents double-booking on dates already reserved
6. **User Booking Conflicts**: Prevents users from booking dates they already have reserved

**Note**: The number of nights checked is `additionalNights + 1`, including the selectedDate and the following additionalNights dates.

## Implementation Notes

- All dates should be in YYYY-MM-DD format
- Day names should be full names (Monday, Tuesday, etc.)
- The script assumes the current date is today when checking advance booking requirements
- User bookings take precedence over general bookings for the same user

## Test Suite Notes

The test suite in `scripts/additional-nights-available/test.js` includes helper functions for time-safe testing:
- `futureISO(days)`: Returns a future date string (YYYY-MM-DD) X days from now
- `futureMMDDYY(days)`: Returns a future date string (MM/DD/YY) X days from now
- `futureMMDD(days)`: Returns a future date string (MM/DD) X days from now

When running tests much later, if any fail due to dates being too far past, use these helper functions to generate current future dates instead of hardcoded ones to avoid time-dependency failures. Most test cases use fixed historical dates (e.g., "2025-12-15") which are intentionally in the past to test past/future booking logic.

## File Structure

```
scripts/
└── additional-nights-available/
    ├── index.js          # Main function (copy to Bubble.io)
    └── test.js           # Comprehensive test suite
```

## Usage

- **Copy to Bubble.io**: Copy the contents of `scripts/additional-nights-available/index.js` to your Bubble.io server-side JavaScript action
- **Run tests**: `node scripts/additional-nights-available/test.js`

## Sample Test Cases

### Test Case 1: Available booking
**Input:**
```json
{
  "selectedDate": "2025-12-15",
  "additionalNights": 3,
  "isChangeRequest": false,
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
    {"checkIn": "2025-12-10", "checkout": "2025-12-12"},
    {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
  ],
  "userBooking": [
    {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
  ],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": true,
  "errorMessage": ""
}
```

### Test Case 2: Conflicting existing booking
**Input:**
```json
{
  "selectedDate": "2025-12-15",
  "additionalNights": 3,
  "isChangeRequest": false,
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
    {"checkIn": "2025-12-15", "checkout": "2025-12-18"},
    {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
  ],
  "userBooking": [
    {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
  ],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "Booking conflict: 2025-12-15 is already booked"
}
```

### Test Case 3: User booking conflict
**Input:**
```json
{
  "selectedDate": "2025-12-15",
  "additionalNights": 3,
  "isChangeRequest": false,
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
    {"checkIn": "2025-12-10", "checkout": "2025-12-12"},
    {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
  ],
  "userBooking": [
    {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
    {"checkIn": "2025-12-16", "checkout": "2025-12-19"}
  ],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "You already have a booking on 2025-12-16"
}
```

### Test Case 4: Day not available for hosting
**Input:**
```json
{
  "selectedDate": "2025-12-21",
  "additionalNights": 2,
  "isChangeRequest": false,
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
    {"checkIn": "2025-12-10", "checkout": "2025-12-12"},
    {"checkIn": "2025-12-20", "checkout": "2025-12-21"}
  ],
  "userBooking": [
    {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
  ],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "Hosting not available on Sunday"
}
```

### Test Case 5: Insufficient advance notice
**Input:**
```json
{
  "selectedDate": "2025-11-10",
  "additionalNights": 1,
  "isChangeRequest": false,
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
  ],
  "userBooking": [],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 5
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "Bookings must be made at least 5 days in advance"
}
```

### Test Case 6: Exceeds future booking limit
**Input:**
```json
{
  "selectedDate": "2026-02-15",
  "additionalNights": 5,
  "isChangeRequest": false,
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
  ],
  "userBooking": [],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 30,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "Cannot book more than 30 days in the future"
}
```

### Test Case 7: Same-day booking not allowed
**Input:**
```json
{
  "selectedDate": "2025-11-06",
  "additionalNights": 1,
  "isChangeRequest": false,
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
  ],
  "userBooking": [],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 0
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "Same-day bookings are not allowed"
}
```

### Test Case 8: Invalid date format
**Input:**
```json
{
  "selectedDate": "2025/12/15",
  "additionalNights": 3,
  "isChangeRequest": false,
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
  ],
  "userBooking": [],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "Invalid selected date format. Expected YYYY-MM-DD"
}
```

### Test Case 9: Invalid additional nights
**Input:**
```json
{
  "selectedDate": "2025-12-15",
  "additionalNights": 0,
  "isChangeRequest": false,
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
  ],
  "userBooking": [],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "Additional nights must be a positive integer"
}
```

### Test Case 10: Multiple nights with mixed conflicts
**Input:**
```json
{
  "selectedDate": "2025-12-15",
  "additionalNights": 5,
  "isChangeRequest": false,
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
    {"checkIn": "2025-12-18", "checkout": "2025-12-19"}
  ],
  "userBooking": [
    {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
    {"checkIn": "2025-12-19", "checkout": "2025-12-20"}
  ],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "Booking conflict: 2025-12-18 is already booked"
}
```

### Test Case 15: Change request - user can book over their own existing bookings
**Input:**
```json
{
  "selectedDate": "2025-12-08",
  "additionalNights": 2,
  "isChangeRequest": true,
  "currentBooking": {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
    {"checkIn": "2025-12-12", "checkout": "2025-12-14"},
    {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
  ],
  "userBooking": [
    {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
  ],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": true,
  "errorMessage": ""
}
```

### Test Case 12: Change request with conflict on different dates
**Input:**
```json
{
  "selectedDate": "2025-12-08",
  "additionalNights": 5,
  "isChangeRequest": true,
  "currentBooking": {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
    {"checkIn": "2025-12-12", "checkout": "2025-12-14"},
    {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
  ],
  "userBooking": [
    {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
  ],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "Booking conflict: 2025-12-12 is already booked"
}
```

### Test Case 13: Change request with invalid selectedDate (no matching user booking)
**Input:**
```json
{
  "selectedDate": "2025-12-15",
  "additionalNights": 2,
  "isChangeRequest": true,
  "currentBooking": {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
    {"checkIn": "2025-12-12", "checkout": "2025-12-14"},
    {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
  ],
  "userBooking": [
    {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
  ],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "You already have a booking on 2025-12-08"
}
```

### Test Case 14: Booking range exceeds future limit
**Input:**
```json
{
  "selectedDate": "2025-12-25",
  "additionalNights": 10,
  "isChangeRequest": false,
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
  ],
  "userBooking": [],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 30,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "Cannot book more than 30 days in the future"
}
```

### Test Case 15: Invalid date in booking arrays
**Input:**
```json
{
  "selectedDate": "2025-12-15",
  "additionalNights": 2,
  "isChangeRequest": false,
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
    {"checkIn": "invalid-date", "checkout": "2025-12-12"}
  ],
  "userBooking": [
    {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
  ],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "Invalid booking range format. Each booking must have checkIn and checkout dates in YYYY-MM-DD format"
}
```

### Test Case 16: Empty booking arrays
**Input:**
```json
{
  "selectedDate": "2025-12-15",
  "additionalNights": 3,
  "isChangeRequest": false,
  "allBookings": [],
  "userBooking": [],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": true,
  "errorMessage": ""
}
```

### Test Case 17: Multiple user bookings with change request
**Input:**
```json
{
  "selectedDate": "2025-12-08",
  "additionalNights": 10,
  "isChangeRequest": true,
  "currentBooking": {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
  "allBookings": [
    {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
    {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
  ],
  "userBooking": [
    {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
    {"checkIn": "2025-12-16", "checkout": "2025-12-18"}
  ],
  "daysAvailableToHost": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  "futureDays": 90,
  "sameDayBooking": false,
  "daysInAdvance": 2
}
```

**Output:**
```json
{
  "status": false,
  "errorMessage": "You already have a booking on 2025-12-16"
}
