// Test script for additional nights availability function
// Run with: node scripts/additional-nights-available-test.js

const { checkAdditionalNightsAvailable } = require('./index');

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
      selectedDate: "2025-11-06",
      additionalNights: 1,
      isChangeRequest: false,
      allBookings: [
        {"checkIn": "2025-12-01", "checkout": "2025-12-06"}
      ],
      userBooking: [],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
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

    console.log(`Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`Actual:   ${JSON.stringify(result)}`);

    if (statusMatch && errorMatch) {
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
