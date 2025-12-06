// Test script for checkAdditionalNightsAvailable frontend function

const { checkAdditionalNightsAvailable } = require("./frontend");

// Helper function for consistent date formatting in expected results
const formatDate = (date) => date.toISOString().split("T")[0];

// Get today's date in YYYY-MM-DD UTC for dynamic test cases
const getTodayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const today = getTodayUtc();
const todayString = formatDate(today);
const tomorrow = new Date(today);
tomorrow.setUTCDate(today.getUTCDate() + 1);
const tomorrowString = formatDate(tomorrow);

const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setUTCDate(today.getUTCDate() + 2);
const dayAfterTomorrowString = formatDate(dayAfterTomorrow);

const twoDaysFromNow = new Date(today);
twoDaysFromNow.setUTCDate(today.getUTCDate() + 2);
const twoDaysFromNowString = formatDate(twoDaysFromNow);

const fiveDaysFromNow = new Date(today);
fiveDaysFromNow.setUTCDate(today.getUTCDate() + 5);
const fiveDaysFromNowString = formatDate(fiveDaysFromNow);

const tenDaysFromNow = new Date(today);
tenDaysFromNow.setUTCDate(today.getUTCDate() + 10);
const tenDaysFromNowString = formatDate(tenDaysFromNow);

const thirtyDaysFromNow = new Date(today);
thirtyDaysFromNow.setUTCDate(today.getUTCDate() + 30);
const thirtyDaysFromNowString = formatDate(thirtyDaysFromNow);

// Test cases
const testCases = [
  // Test Case 1: Basic available booking - one night, no conflicts
  {
    name: "Basic available booking - one night",
    input: {
      selectedDate: tomorrowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: true, message: "", errorMessage: "" },
  },
  // Test Case 2: Booking two nights, allowed
  {
    name: "Booking two nights, allowed",
    input: {
      selectedDate: tomorrowString,
      additionalNights: 1, // Book for 2 nights
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: true, message: "", errorMessage: "" },
  },
  // Test Case 3: Additional nights not allowed
  {
    name: "Additional nights not allowed",
    input: {
      selectedDate: tomorrowString,
      additionalNights: 1,
      allowAdditionalNights: false,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: false, message: "Additional nights are not allowed", errorMessage: "" },
  },
  // Test Case 4: Date blocked - Yearly (object format)
  {
    name: "Date blocked - Yearly (object format)",
    input: {
      selectedDate: fiveDaysFromNowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [{ start: fiveDaysFromNowString, end: fiveDaysFromNowString, spaces: [1] }],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: false, message: `Date blocked: ${fiveDaysFromNowString}`, errorMessage: "" },
  },
  // Test Case 5: Date blocked - Not Yearly (object format)
  {
    name: "Date blocked - Not Yearly (object format)",
    input: {
      selectedDate: tenDaysFromNowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [{ start: tenDaysFromNowString, end: tenDaysFromNowString, spaces: [1] }],
      space: 1,
    },
    expected: { status: false, message: `Date blocked: ${tenDaysFromNowString}`, errorMessage: "" },
  },
  // Test Case 6: Booking conflict with allBookings
  {
    name: "Booking conflict with allBookings",
    input: {
      selectedDate: tomorrowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [{ checkIn: tomorrowString, checkout: dayAfterTomorrowString }],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: false, message: `Booking conflict: ${tomorrowString} is already booked`, errorMessage: "" },
  },
  // Test Case 7: User already has a booking
  {
    name: "User already has a booking",
    input: {
      selectedDate: tomorrowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [{ checkIn: tomorrowString, checkout: dayAfterTomorrowString }],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: false, message: `You already have a booking on ${tomorrowString}`, errorMessage: "" },
  },
  // Test Case 8: Invalid JSON string input
  {
    name: "Invalid JSON string input",
    input: `{\"selectedDate\": \"2025-12-25\", invalid}`,
    expected: { status: false, message: "", errorMessage: "Invalid JSON input format" },
  },
  // Test Case 9: Hosting not available on selected day (dynamic day)
  {
    name: "Hosting not available on selected day",
    input: {
      selectedDate: tomorrowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].filter(day => day !== new Date(tomorrow).toLocaleDateString("en-US", { weekday: "long" })),
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: false, message: `Hosting not available on ${new Date(tomorrow).toLocaleDateString("en-US", { weekday: "long" })}`, errorMessage: "" },
  },
  // Test Case 10: Change Request - current booking is ignored for conflict
  {
    name: "Change Request - current booking is ignored",
    input: {
      selectedDate: tomorrowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: true,
      currentBooking: { checkIn: tomorrowString, checkout: dayAfterTomorrowString },
      allBookings: [{ checkIn: tomorrowString, checkout: dayAfterTomorrowString }], // This should be ignored
      userBooking: [{ checkIn: tomorrowString, checkout: dayAfterTomorrowString }], // This should be ignored
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: true, message: "", errorMessage: "" },
  },
  // Test Case 11: Future days limit exceeded
  {
    name: "Future days limit exceeded",
    input: {
      selectedDate: thirtyDaysFromNowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 20,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: false, message: "Cannot book more than 20 days in the future", errorMessage: "" },
  },
  // Test Case 12: Days in advance requirement not met
  {
    name: "Days in advance requirement not met",
    input: {
      selectedDate: tomorrowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 2, // Changed to 2 to make the test case valid for "not met" scenario
      blockedYearly: [],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: false, message: "Bookings must be made at least 2 days in advance", errorMessage: "" },
  },
  // Test Case 13: Same-day booking not allowed, but selected date is today
  {
    name: "Same-day booking not allowed, selected today",
    input: {
      selectedDate: todayString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: false,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: false, message: "Same-day bookings are not allowed", errorMessage: "" },
  },
  // Test Case 14: Blocked yearly (object format) for a different space (should not block)
  {
    name: "Blocked yearly for different space",
    input: {
      selectedDate: fiveDaysFromNowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [{ start: fiveDaysFromNowString, end: fiveDaysFromNowString, spaces: [2] }],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: true, message: "", errorMessage: "" },
  },
  // Test Case 15: Blocked yearly (object format) globally (should block)
  {
    name: "Blocked yearly globally",
    input: {
      selectedDate: fiveDaysFromNowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [{ start: fiveDaysFromNowString, end: fiveDaysFromNowString, spaces: [] }],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: false, message: `Date blocked: ${fiveDaysFromNowString}`, errorMessage: "" },
  },
  // Test Case 16: Blocked yearly (object format) without spaces field (should block globally)
  {
    name: "Blocked yearly without spaces field (global)",
    input: {
      selectedDate: fiveDaysFromNowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [{ start: fiveDaysFromNowString, end: fiveDaysFromNowString }],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: false, message: `Date blocked: ${fiveDaysFromNowString}`, errorMessage: "" },
  },
  // Test Case 17: Invalid blockedYearly entry (non-object) should be ignored and set error message
  {
    name: "Invalid blockedYearly entry (non-object)",
    input: {
      selectedDate: tomorrowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: ["BAD_FORMAT"],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: true, message: "Some blocked dates were ignored due to invalid format", errorMessage: "Ignored invalid blocked entries: [\"BAD_FORMAT\"]" },
  },
  // Test Case 18: Invalid blockedNoYearly entry (non-object) should be ignored and set error message
  {
    name: "Invalid blockedNoYearly entry (non-object)",
    input: {
      selectedDate: tomorrowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: ["ANOTHER_BAD_FORMAT"],
      space: 1,
    },
    expected: { status: true, message: "Some blocked dates were ignored due to invalid format", errorMessage: "Ignored invalid blocked entries: [\"ANOTHER_BAD_FORMAT\"]" },
  },
  // Test Case 19: Invalid blocked yearly (missing start/end)
  {
    name: "Invalid blocked yearly (missing start/end)",
    input: {
      selectedDate: tomorrowString,
      additionalNights: 0,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [{ someField: "value" }],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: true, message: "Some blocked dates were ignored due to invalid format", errorMessage: "Ignored invalid blocked entries: [\"{\\\"someField\\\":\\\"value\\\"}\"]" },
  },
  // Test Case 20: Range of blocked yearly dates
  {
    name: "Range of blocked yearly dates",
    input: {
      selectedDate: twoDaysFromNowString,
      additionalNights: 2,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [{ start: todayString, end: fiveDaysFromNowString, spaces: [1] }],
      blockedNoYearly: [],
      space: 1,
    },
    expected: { status: false, message: `Date blocked: ${twoDaysFromNowString}`, errorMessage: "" },
  },
  // Test Case 21: Range of blocked non-yearly dates
  {
    name: "Range of blocked non-yearly dates",
    input: {
      selectedDate: twoDaysFromNowString,
      additionalNights: 2,
      allowAdditionalNights: true,
      isChangeRequest: false,
      currentBooking: null,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [{ start: todayString, end: fiveDaysFromNowString, spaces: [1] }],
      space: 1,
    },
    expected: { status: false, message: `Date blocked: ${twoDaysFromNowString}`, errorMessage: "" },
  },
];

// Test runner function
function runTests() {
  console.log("=".repeat(80));
  console.log("ADDITIONAL NIGHTS AVAILABLE FRONTEND TEST SUITE");
  console.log("=".repeat(80));
  console.log("");

  let passed = 0;
  let failed = 0;
  const failedTests = []; // Initialize here

  testCases.forEach((testCase, index) => {
    console.log(`Test Case ${index + 1}: ${testCase.name}`);
    console.log("-".repeat(60));

    let inputToTest;
    if (typeof testCase.input === "string") {
      inputToTest = testCase.input;
    }

    else {
      inputToTest = JSON.stringify(testCase.input);
    }

    const result = checkAdditionalNightsAvailable(inputToTest);

    console.log(`Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`Actual:   ${JSON.stringify(result)}`);

    if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
      console.log("✅ PASS");
      passed++;
    } else {
      console.log("❌ FAIL");
      failed++;
      failedTests.push(testCase.name);
    }

    console.log("");
  });

  // Summary
  console.log("=".repeat(80));
  console.log("TEST SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log("\nFailed Test Cases:");
    failedTests.forEach(name => console.log(`- ${name}`));
  }

  if (failed === 0) {
    console.log("🎉 All tests passed!");
  }

  else {
    console.log("⚠️  Some tests failed. Please review the output above.");
  }

  return { passed, failed, total: testCases.length, failedTests };
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testCases, runTests };
