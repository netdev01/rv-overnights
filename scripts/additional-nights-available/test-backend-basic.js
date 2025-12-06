// Rewritten, deterministic test suite for additional nights availability
// Uses futureISO(...) to keep dates time-safe
const { checkAdditionalNightsAvailable } = require("./backend");

function formatISO(d) {
  return d.toISOString().split("T")[0];
}
function futureISO(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return formatISO(d);
}
function futureMMDDYY(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}
function futureMMDD(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

const tests = [];

// Helper to compute weekday name for a future offset
function weekdayOf(offset) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

// 1. Simple available booking (no conflicts)
tests.push({
  name: "Available booking (no conflicts)",
  input: {
    selectedDate: futureISO(10),
    additionalNights: 2,
    allowAdditionalNights: true,
    isChangeRequest: false,
    allBookings: [{ checkIn: futureISO(20), checkout: futureISO(22) }],
    userBooking: [],
    daysAvailableToHost: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    futureDays: 365,
    sameDayBooking: false,
    daysInAdvance: 1,
  },
  expected: { status: true, errorMessage: "" },
});

// 2. Existing booking conflict
(function () {
  const selOffset = 15;
  const sel = futureISO(selOffset);
  const conflict = futureISO(selOffset); // exact same day
  tests.push({
    name: "Conflicting existing booking",
    input: {
      selectedDate: sel,
      additionalNights: 1,
      allowAdditionalNights: true,
      isChangeRequest: false,
      allBookings: [{ checkIn: conflict, checkout: futureISO(selOffset + 2) }],
      userBooking: [],
      daysAvailableToHost: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
    },
    expected: {
      status: false,
      message: `Booking conflict: ${conflict} is already booked`,
      errorMessage: "",
    },
  });
})();

// 3. User booking conflict
(function () {
  const selOffset = 30;
  const sel = futureISO(selOffset);
  const userBookStart = futureISO(selOffset + 1);
  tests.push({
    name: "User booking conflict",
    input: {
      selectedDate: sel,
      additionalNights: 2,
      allowAdditionalNights: true,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [
        { checkIn: userBookStart, checkout: futureISO(selOffset + 4) },
      ],
      daysAvailableToHost: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
    },
    expected: {
      status: false,
      message: `You already have a booking on ${userBookStart}`,
      errorMessage: "",
    },
  });
})();

// 4. Additional nights not allowed (omitted -> defaults false)
tests.push({
  name: "Additional nights not allowed by default",
  input: {
    selectedDate: futureISO(12),
    additionalNights: 1,
    // allowAdditionalNights omitted
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
  },
  expected: {
    status: false,
    message: "Additional nights are not allowed",
    errorMessage: "",
  },
});

// 5. allowAdditionalNights true allows extra nights
tests.push({
  name: "allowAdditionalNights true allows extra nights",
  input: {
    selectedDate: futureISO(12),
    additionalNights: 2,
    allowAdditionalNights: true,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
  },
  expected: { status: true, errorMessage: "" },
});

// 6. Invalid JSON input string
tests.push({
  name: "Invalid JSON string",
  input: '{"selectedDate": "2026-03-01", "additionalNights": 2, invalid}',
  expected: { status: false, errorMessage: "Invalid JSON input format" },
});

// 7. Invalid date format
tests.push({
  name: "Invalid date format",
  input: {
    selectedDate: "2026/03/15",
    additionalNights: 1,
    allowAdditionalNights: true,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
  },
  expected: {
    status: false,
    errorMessage: "Invalid selected date format. Expected YYYY-MM-DD",
  },
});

// 8. Negative additional nights
tests.push({
  name: "Negative additional nights",
  input: {
    selectedDate: futureISO(5),
    additionalNights: -1,
    allowAdditionalNights: true,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
  },
  expected: {
    status: false,
    errorMessage: "Additional nights must be a non-negative integer",
  },
});

// 9. Future days limit exceeded
tests.push({
  name: "Future days limit exceeded",
  input: {
    selectedDate: futureISO(400),
    additionalNights: 1,
    allowAdditionalNights: true,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
  },
  expected: {
    status: false,
    message: "Cannot book more than 365 days in the future",
    errorMessage: "",
  },
});

// 10. Blocked yearly (MM-DD) prevents booking
(function () {
  const offset = 20;
  const sel = futureISO(offset);
  const mmdd = futureMMDD(offset);
  tests.push({
    name: "Blocked yearly prevents booking",
    input: {
      selectedDate: sel,
      additionalNights: 1,
      allowAdditionalNights: true,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [mmdd],
      blockedNoYearly: [],
    },
    expected: {
      status: false,
      message: `Date blocked: ${sel}`,
      errorMessage: "",
    },
  });
})();

// 11. Blocked non-yearly (YYYY-MM-DD) prevents booking
(function () {
  const offset = 25;
  const sel = futureISO(offset);
  tests.push({
    name: "Blocked non-yearly prevents booking",
    input: {
      selectedDate: sel,
      additionalNights: 1,
      allowAdditionalNights: true,
      isChangeRequest: false,
      allBookings: [],
      userBooking: [],
      daysAvailableToHost: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
      blockedYearly: [],
      blockedNoYearly: [sel],
    },
    expected: {
      status: false,
      message: `Date blocked: ${sel}`,
      errorMessage: "",
    },
  });
})();

// 12. Change request can overlap user's own booking
(function () {
  const selOffset = 10;
  const sel = futureISO(selOffset);
  tests.push({
    name: "Change request overlap own booking allowed",
    input: {
      selectedDate: sel,
      additionalNights: 1,
      allowAdditionalNights: true,
      isChangeRequest: true,
      currentBooking: { checkIn: sel, checkout: futureISO(selOffset + 2) },
      allBookings: [
        {
          checkIn: futureISO(selOffset + 5),
          checkout: futureISO(selOffset + 6),
        },
      ],
      userBooking: [{ checkIn: sel, checkout: futureISO(selOffset + 2) }],
      daysAvailableToHost: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      futureDays: 365,
      sameDayBooking: true,
      daysInAdvance: 0,
    },
    expected: { status: true, errorMessage: "" },
  });
})();

// Run tests
function run() {
  console.log("=".repeat(80));
  console.log("TEST SUITE");
  console.log("=".repeat(80));
  let passed = 0,
    failed = 0;
  tests.forEach((t, i) => {
    console.log(`Test ${i + 1}: ${t.name}`);
    const result = checkAdditionalNightsAvailable(t.input);
    const statusMatch = result.status === t.expected.status;
    const errMatch =
      (result.errorMessage || "") === (t.expected.errorMessage || "");
    const msgMatch = (result.message || "") === (t.expected.message || "");
    console.log("Expected:", t.expected);
    console.log("Actual:  ", result);
    if (statusMatch && errMatch && msgMatch) {
      console.log("PASS");
      passed++;
    } else {
      console.log("FAIL");
      if (!statusMatch) console.log(" Status mismatch");
      if (!errMatch) console.log(" Error mismatch");
      if (!msgMatch) console.log(" Message mismatch");
      failed++;
    }
    console.log("");
  });
  console.log("SUMMARY", passed, "passed,", failed, "failed");
  return { passed, failed, total: tests.length };
}

if (require.main === module) run();
module.exports = { tests, run };
