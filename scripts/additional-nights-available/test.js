// Test script for additional nights availability function
// Run with: node scripts/additional-nights-available-test.js

const { checkAdditionalNightsAvailable } = require('./index');

// Helper functions for time-safe tests
function formatISO(d) {
  return d.toISOString().split('T')[0];
}
function futureISO(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return formatISO(d);
}
function futureMMDDYY(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const mm = String(d.getUTCMonth() + 1).padStart(2,'0');
  const dd = String(d.getUTCDate()).padStart(2,'0');
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`; // Return MM/DD/YY format for blockedNoYearly
}
function futureMMDD(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const mm = String(d.getUTCMonth() + 1).padStart(2,'0');
  const dd = String(d.getUTCDate()).padStart(2,'0');
  return `${mm}-${dd}`; // Use hyphen for MM-DD format
}
function futurePlusOneYearOneDay() {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(d.getUTCDate() + 1);
  return formatISO(d);
}

// Comprehensive test cases covering all scenarios
const testCases = [
  // Test Case 1: Available booking
  {
    name: "Available booking",
    input: {
      selectedDate: "2025-12-15",
      additionalNights: 3,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
        {"checkIn": "2025-12-10", "checkout": "2025-12-12"},
        {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
      ],
      userBooking: [
        {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
      ],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: true,
      errorMessage: ""
    }
  },
  // Test Case 2: Conflicting existing booking
  {
    name: "Conflicting existing booking",
    input: {
      selectedDate: "2025-12-15",
      additionalNights: 3,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
        {"checkIn": "2025-12-15", "checkout": "2025-12-18"},
        {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
      ],
      userBooking: [
        {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
      ],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "Booking conflict: 2025-12-15 is already booked"
    }
  },
  // Test Case 3: User booking conflict
  {
    name: "User booking conflict",
    input: {
      selectedDate: "2025-12-15",
      additionalNights: 3,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
        {"checkIn": "2025-12-10", "checkout": "2025-12-12"},
        {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
      ],
      userBooking: [
        {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
        {"checkIn": "2025-12-16", "checkout": "2025-12-19"}
      ],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "You already have a booking on 2025-12-16"
    }
  },
  // Test Case 4: Day not available for hosting
  {
    name: "Day not available for hosting",
    input: {
      selectedDate: "2025-12-21",
      additionalNights: 2,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
        {"checkIn": "2025-12-10", "checkout": "2025-12-12"},
        {"checkIn": "2025-12-20", "checkout": "2025-12-21"}
      ],
      userBooking: [
        {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
      ],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "Hosting not available on Sunday"
    }
  },
  // Test Case 5: Insufficient advance notice
  {
    name: "Insufficient advance notice",
    input: {
      selectedDate: "2025-11-10",
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
      ],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 5
    },
    expected: {
      status: false,
      errorMessage: "Bookings must be made at least 5 days in advance"
    }
  },
  // Test Case 6: Exceeds future booking limit
  {
    name: "Exceeds future booking limit",
    input: {
      selectedDate: "2026-02-15",
      additionalNights: 5,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
      ],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 30,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "Cannot book more than 30 days in the future"
    }
  },
  // Test Case 7: Same-day booking not allowed
  {
    name: "Same-day booking not allowed",
    input: {
      selectedDate: new Date().toISOString().split('T')[0], // Today's date
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
      ],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 0
    },
    expected: {
      status: false,
      errorMessage: "Same-day bookings are not allowed"
    }
  },
  // Test Case 8: Invalid date format
  {
    name: "Invalid date format",
    input: {
      selectedDate: "2025/12/15",
      additionalNights: 3,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
      ],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "Invalid selected date format. Expected YYYY-MM-DD"
    }
  },
  // Test Case 9: Invalid additional nights
  {
    name: "Invalid additional nights",
    input: {
      selectedDate: "2025-12-15",
      additionalNights: 0,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
      ],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "Additional nights must be a positive integer"
    }
  },
  // Test Case 10: Multiple nights with mixed conflicts
  {
    name: "Multiple nights with mixed conflicts",
    input: {
      selectedDate: "2025-12-15",
      additionalNights: 5,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
        {"checkIn": "2025-12-18", "checkout": "2025-12-19"}
      ],
      userBooking: [
        {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
        {"checkIn": "2025-12-19", "checkout": "2025-12-20"}
      ],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "Booking conflict: 2025-12-18 is already booked"
    }
  },
  // Test Case 20: Additional nights semantics (1 additional = 2 nights)
  {
    name: "Additional nights semantics (1 additional = checks selectedDate + one more)",
    input: {
      selectedDate: "2025-11-30",
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: true,
      errorMessage: ""
    }
  },
  // Test Case 21: Additional nights with conflict on extra night
  {
    name: "Additional nights with conflict on extra night",
    input: {
      selectedDate: "2025-11-30",
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [{
        checkIn: "2025-12-01",
        checkout: "2025-12-05"
      }],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "You already have a booking on 2025-12-01"
    }
  },
  // Test Case 11: Change request - user can book over their own existing bookings
  {
    name: "Change request - user can book over their own existing bookings",
    input: {
      selectedDate: "2025-12-08",
      additionalNights: 2,
      isChangeRequest: true,
      currentBooking: {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
        {"checkIn": "2025-12-12", "checkout": "2025-12-14"},
        {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
      ],
      userBooking: [
        {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
      ],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: true,
      errorMessage: ""
    }
  },
  // Test Case 12: Change request with conflict on different dates
  {
    name: "Change request with conflict on different dates",
    input: {
      selectedDate: "2025-12-08",
      additionalNights: 5,
      isChangeRequest: true,
      currentBooking: {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
        {"checkIn": "2025-12-12", "checkout": "2025-12-14"},
        {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
      ],
      userBooking: [
        {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
      ],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "Booking conflict: 2025-12-12 is already booked"
    }
  },
  // Test Case 13: Change request with invalid selectedDate (no matching user booking)
  {
    name: "Change request with invalid selectedDate (no matching user booking)",
    input: {
      selectedDate: "2025-12-15",
      additionalNights: 2,
      isChangeRequest: true,
      currentBooking: {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
        {"checkIn": "2025-12-12", "checkout": "2025-12-14"},
        {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
      ],
      userBooking: [
        {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
        {"checkIn": "2025-12-16", "checkout": "2025-12-18"}
      ],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "You already have a booking on 2025-12-16"
    }
  },
  // Test Case 14: Booking range exceeds future limit
  {
    name: "Booking range exceeds future limit",
    input: {
      selectedDate: "2025-12-25",
      additionalNights: 10,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
      ],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 30,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "Cannot book more than 30 days in the future"
    }
  },
  // Test Case 15: Invalid date in booking arrays
  {
    name: "Invalid date in booking arrays",
    input: {
      selectedDate: "2025-12-15",
      additionalNights: 2,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
        {"checkIn": "invalid-date", "checkout": "2025-12-12"}
      ],
      userBooking: [
        {"checkIn": "2025-12-08", "checkout": "2025-12-10"}
      ],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "Invalid booking range format. Each booking must have checkIn and checkout dates in YYYY-MM-DD format"
    }
  },
  // Test Case 16: Empty booking arrays
  {
    name: "Empty booking arrays",
    input: {
      selectedDate: "2025-12-15",
      additionalNights: 3,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: true,
      errorMessage: ""
    }
  },
  // Test Case 17: Multiple user bookings with change request
  {
    name: "Multiple user bookings with change request",
    input: {
      selectedDate: "2025-12-08",
      additionalNights: 10,
      isChangeRequest: true,
      currentBooking: {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"},
        {"checkIn": "2025-12-20", "checkout": "2025-12-22"}
      ],
      userBooking: [
        {"checkIn": "2025-12-08", "checkout": "2025-12-10"},
        {"checkIn": "2025-12-16", "checkout": "2025-12-18"}
      ],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    expected: {
      status: false,
      errorMessage: "You already have a booking on 2025-12-16"
    }
  },
  // Test Case 18: JSON string input (Bubble.io compatibility)
  {
    name: "JSON string input (Bubble.io compatibility)",
    input: JSON.stringify({
      selectedDate: "2025-12-01",
      additionalNights: 2,
      isChangeRequest: true,
      currentBooking: {"checkIn": "2025-12-01", "checkout": "2025-12-04"},
      allBookings: [{
        "checkIn": "2025-11-11",
        "checkout": "2025-11-14"
      },{
        "checkIn": "2025-11-23",
        "checkout": "2025-11-25"
      },{
        "checkIn": "2025-12-01",
        "checkout": "2025-12-04"
      },{
        "checkIn": "2025-12-15",
        "checkout": "2025-12-16"
      }],
      userBooking: [{
        "checkIn": "2025-11-11",
        "checkout": "2025-11-14"
      },{
        "checkIn": "2025-11-23",
        "checkout": "2025-11-25"
      },{
        "checkIn": "2025-12-01",
        "checkout": "2025-12-04"
      }],
      daysAvailableToHost: ["Wednesday","Monday","Sunday","Saturday","Thursday","Tuesday","Friday"],
      futureDays: 365,
      sameDayBooking: false,
      daysInAdvance: 1
    }),
    expected: {
      status: true,
      errorMessage: ""
    }
  },
  // Test Case 19: Invalid JSON string input
  {
    name: "Invalid JSON string input",
    input: '{"selectedDate": "2025-12-01", "additionalNights": 2, invalid}',
    expected: {
      status: false,
      errorMessage: "Invalid JSON input format"
    }
  },
  // Test Case 20: Blocked date (yearly) prevents booking
  {
    name: "Blocked date (yearly) prevents booking",
    input: {
      selectedDate: futureISO(30),
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [futureMMDD(30)], // MM/DD blocked yearly
      blockedNoYearly: []
    },
    expected: {
      status: false,
      message: `Date blocked: ${futureISO(30)}`,
      errorMessage: ""
    }
  },
  // Test Case 21: Blocked date (non-yearly) prevents booking
  {
    name: "Blocked date (non-yearly) prevents booking",
    input: {
      selectedDate: futureISO(40),
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [futureMMDDYY(40)]
    },
    expected: {
      status: false,
      message: `Date blocked: ${futureISO(40)}`,
      errorMessage: ""
    }
  },
  // Test Case 22: Booking available when blocked lists omitted (backwards compatibility)
  {
    name: "Booking available when blocked lists omitted (backwards compatibility)",
    input: {
      selectedDate: futureISO(30),
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: []
      // No blocked dates - should work as before
    },
    expected: {
      status: true,
      errorMessage: ""
    }
  },
  // Test Case 23: Blocked date with some malformed entries present
  {
    name: "Blocked date with some malformed entries present",
    input: {
      selectedDate: futureISO(40),
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [futureMMDD(40)], // Valid blocked entry
      blockedNoYearly: ["invalid-format", "2025-13-01"] // Malformed entries
    },
    expected: {
      status: false,
      message: `Date blocked: ${futureISO(40)}`,
      errorMessage: `Ignored invalid blockedNoYearly entries: ['invalid-format', '2025-13-01']`
    }
  },
  // Test Case 24: Blocked date with some malformed yearly entries present
  {
    name: "Blocked date with some malformed yearly entries present",
    input: {
      selectedDate: futureISO(50),
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: ["33-01", "99-99"], // Malformed yearly entries
      blockedNoYearly: [futureMMDDYY(50)] // Valid non-yearly that should block
    },
    expected: {
      status: false,
      message: `Date blocked: ${futureISO(50)}`,
      errorMessage: `Ignored invalid blockedYearly entries: ['33-01', '99-99']`
    }
  },
  // Test Case 25: Booking exceeds 1 calendar year limit
  {
    name: "Booking exceeds 1 calendar year limit",
    input: {
      selectedDate: futurePlusOneYearOneDay(),
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 3650, // Very large to not interfere
      sameDayBooking: true,
      daysInAdvance: 0
    },
    expected: {
      status: false,
      errorMessage: "Cannot book more than 1 year(s) in the future"
    }
  },
  // Test Case 26: Object-format blockedYearly with space filtering (space=1 includes entry)
  {
    name: "Object-format blockedYearly with space filtering (included)",
    input: {
      space: 1,
      selectedDate: "2025-12-10",
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [{"spaces": [1], "start": "2025-12-10", "end": "2025-12-10"}],
      blockedNoYearly: []
    },
    expected: {
      status: false,
      message: "Date blocked: 2025-12-10",
      errorMessage: ""
    }
  },
  // Test Case 27: Object-format blockedYearly space filtering (excluded)
  {
    name: "Object-format blockedYearly with space filtering (excluded)",
    input: {
      space: 2,
      selectedDate: "2025-12-10",
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [{"spaces": [1], "start": "2025-12-10", "end": "2025-12-10"}],
      blockedNoYearly: []
    },
    expected: {
      status: true,
      errorMessage: ""
    }
  },
  // Test Case 28: Object-format blockedNoYearly range
  {
    name: "Object-format blockedNoYearly range",
    input: {
      selectedDate: "2025-12-26",
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [{"spaces": [], "start": "2025-12-26", "end": "2025-12-27"}]
    },
    expected: {
      status: false,
      message: "Date blocked: 2025-12-26",
      errorMessage: ""
    }
  },
  // Test Case 29: Mixed object and string blocked entries
  {
    name: "Mixed object and string blocked entries",
    input: {
      space: 1,
      selectedDate: "2025-12-10",
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: ["11/15", {"spaces": [1], "start": "2025-12-10", "end": "2025-12-10"}],
      blockedNoYearly: []
    },
    expected: {
      status: false,
      message: "Date blocked: 2025-12-10",
      errorMessage: ""
    }
  }
];

// Test runner function
function runTests() {
  console.log('='.repeat(80));
  console.log('ADDITIONAL NIGHTS AVAILABILITY TEST SUITE');
  console.log('='.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    console.log(`Test Case ${index + 1}: ${testCase.name}`);
    console.log('-'.repeat(60));

    const result = checkAdditionalNightsAvailable(testCase.input);

    // Check if result matches expected
    const statusMatch = result.status === testCase.expected.status;
    const errorMatch = result.errorMessage === testCase.expected.errorMessage;
    const messageMatch = (result.message || "") === (testCase.expected.message || "");

    console.log(`Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`Actual:   ${JSON.stringify(result)}`);

    if (statusMatch && errorMatch && messageMatch) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL');
      if (!statusMatch) {
        console.log(`   Status mismatch: expected ${testCase.expected.status}, got ${result.status}`);
      }
      if (!errorMatch) {
        console.log(`   Error mismatch: expected "${testCase.expected.errorMessage}", got "${result.errorMessage}"`);
      }
      if (!messageMatch) {
        console.log(`   Message mismatch: expected "${testCase.expected.message}", got "${result.message}"`);
      }
      failed++;
    }

    console.log('');
  });

  // Summary
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
  }

  return { passed, failed, total: testCases.length };
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testCases, runTests };
