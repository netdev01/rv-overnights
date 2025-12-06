// Additional tests for missing edge cases in additional-nights-available
const { checkAdditionalNightsAvailable } = require("./index");

function formatISO(d) { return d.toISOString().split("T")[0]; }
function futureISO(days) { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); return formatISO(d); }
function futureMMDDYY(days) { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); const mm = String(d.getUTCMonth() + 1).padStart(2, "0"); const dd = String(d.getUTCDate()).padStart(2, "0"); const yy = String(d.getUTCFullYear()).slice(-2); return `${mm}/${dd}/${yy}`; }
function futureMMDD(days) { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); const mm = String(d.getUTCMonth() + 1).padStart(2, "0"); const dd = String(d.getUTCDate()).padStart(2, "0"); return `${mm}-${dd}`; }

const tests = [];

// 1. Same-day booking disallowed when sameDayBooking=false
tests.push({
  name: "Same-day booking disallowed when sameDayBooking is false",
  input: {
    selectedDate: futureISO(0),
    additionalNights: 0,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    futureDays: 365,
    sameDayBooking: false,
    daysInAdvance: 0,
  },
  expected: { status: false, message: "Same-day bookings are not allowed" },
});

// 2. Same-day booking allowed when sameDayBooking=true
tests.push({
  name: "Same-day booking allowed when sameDayBooking is true",
  input: {
    selectedDate: futureISO(0),
    additionalNights: 0,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
  },
  expected: { status: true, errorMessage: "" },
});

// 3. Advance boundary allowed when exactly daysInAdvance
tests.push({
  name: "Advance boundary allowed when exactly daysInAdvance",
  input: {
    selectedDate: futureISO(5),
    additionalNights: 0,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 5,
  },
  expected: { status: true, errorMessage: "" },
});

// 4. Advance boundary blocked when less than daysInAdvance
tests.push({
  name: "Advance boundary blocked when less than daysInAdvance",
  input: {
    selectedDate: futureISO(4),
    additionalNights: 0,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 5,
  },
  expected: { status: false, message: "Bookings must be made at least 5 days in advance" },
});

// 5. Validation: allowAdditionalNights non-boolean
tests.push({
  name: "Validation: allowAdditionalNights must be boolean",
  input: {
    selectedDate: futureISO(10),
    additionalNights: 0,
    allowAdditionalNights: "true",
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday"],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
  },
  expected: { status: false, errorMessage: "allowAdditionalNights must be a boolean" },
});

// 6. Validation: isChangeRequest non-boolean
tests.push({
  name: "Validation: isChangeRequest must be boolean",
  input: {
    selectedDate: futureISO(10),
    additionalNights: 0,
    allowAdditionalNights: true,
    isChangeRequest: "yes",
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday"],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
  },
  expected: { status: false, errorMessage: "isChangeRequest must be a boolean" },
});

// 7. Validation: sameDayBooking non-boolean
tests.push({
  name: "Validation: sameDayBooking must be boolean",
  input: {
    selectedDate: futureISO(10),
    additionalNights: 0,
    allowAdditionalNights: true,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday"],
    futureDays: 365,
    sameDayBooking: "no",
    daysInAdvance: 0,
  },
  expected: { status: false, errorMessage: "Same day booking must be a boolean" },
});

// 8. Validation: futureDays negative
tests.push({
  name: "Validation: futureDays must be non-negative integer",
  input: {
    selectedDate: futureISO(10),
    additionalNights: 0,
    allowAdditionalNights: true,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday"],
    futureDays: -1,
    sameDayBooking: true,
    daysInAdvance: 0,
  },
  expected: { status: false, errorMessage: "Future days must be a non-negative integer" },
});

// 9. Validation: daysInAdvance negative
tests.push({
  name: "Validation: daysInAdvance must be non-negative integer",
  input: {
    selectedDate: futureISO(10),
    additionalNights: 0,
    allowAdditionalNights: true,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday"],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: -2,
  },
  expected: { status: false, errorMessage: "Days in advance must be a non-negative integer" },
});

// 10. Validation: space invalid (0)
tests.push({
  name: "Validation: space must be positive integer when provided",
  input: {
    selectedDate: futureISO(10),
    additionalNights: 0,
    allowAdditionalNights: true,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday"],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
    space: 0,
  },
  expected: { status: false, errorMessage: "space must be a positive integer or omitted" },
});

// 11. isChangeRequest true but missing currentBooking
tests.push({
  name: "Change request missing currentBooking",
  input: {
    selectedDate: futureISO(10),
    additionalNights: 0,
    allowAdditionalNights: true,
    isChangeRequest: true,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday"],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
  },
  expected: { status: false, errorMessage: "currentBooking must be provided for change requests and must have valid checkIn and checkout dates in YYYY-MM-DD format" },
});

// 12. blockedNoYearly legacy MM/DD/YY parsing
(function(){ const offset = 7; const sel = futureISO(offset); const mmddyy = futureMMDDYY(offset); tests.push({ name: "blockedNoYearly legacy MM/DD/YY prevents booking", input: { selectedDate: sel, additionalNights: 0, allowAdditionalNights: true, isChangeRequest: false, allBookings: [], userBooking: [], daysAvailableToHost: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], futureDays: 365, sameDayBooking: true, daysInAdvance: 0, blockedYearly: [], blockedNoYearly: [mmddyy], }, expected: { status: false, message: `Date blocked: ${sel}`, errorMessage: "" }, }); })();

// 13. blockedYearly object with spaces matching applies
(function(){ const offset = 9; const sel = futureISO(offset); const start = sel; const end = futureISO(offset+1); tests.push({ name: "blockedYearly object with spaces that include input.space applies", input: { selectedDate: sel, additionalNights: 0, allowAdditionalNights: true, isChangeRequest: false, allBookings: [], userBooking: [], daysAvailableToHost: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], futureDays: 365, sameDayBooking: true, daysInAdvance: 0, space: 42, blockedYearly: [{ start, end, spaces: [42] }], blockedNoYearly: [], }, expected: { status: false, message: `Date blocked: ${sel}`, errorMessage: "" }, }); })();

// 14. blockedYearly object with spaces that do NOT include input.space does not apply
(function(){ const offset = 11; const sel = futureISO(offset); const start = sel; const end = futureISO(offset+1); tests.push({ name: "blockedYearly object with spaces not including input.space is skipped", input: { selectedDate: sel, additionalNights: 0, allowAdditionalNights: true, isChangeRequest: false, allBookings: [], userBooking: [], daysAvailableToHost: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], futureDays: 365, sameDayBooking: true, daysInAdvance: 0, space: 99, blockedYearly: [{ start, end, spaces: [1,2,3] }], blockedNoYearly: [], }, expected: { status: true, errorMessage: "" }, }); })();

// 15. invalid blocked entries produce ignored message and technical errorMessage
tests.push({
  name: "Invalid blocked entries are reported and ignored",
  input: {
    selectedDate: futureISO(20),
    additionalNights: 0,
    allowAdditionalNights: true,
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
    blockedYearly: ["13-32", "bad"],
    blockedNoYearly: [],
  },
  expected: { status: true, message: "Some blocked dates were ignored due to invalid format", errorMessage: "Ignored invalid blockedYearly entries: ['13-32', 'bad']" },
});

// 16. invalid booking object in allBookings
tests.push({
  name: "Invalid booking object in allBookings triggers error",
  input: {
    selectedDate: futureISO(30),
    additionalNights: 0,
    allowAdditionalNights: true,
    isChangeRequest: false,
    allBookings: [{ checkIn: "invalid", checkout: "2025-12-12" }],
    userBooking: [],
    daysAvailableToHost: ["Monday"],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
  },
  expected: { status: false, errorMessage: "Invalid booking range format. Each booking must have checkIn and checkout dates in YYYY-MM-DD format" },
});

// 17. additionalNights === 0 with allowAdditionalNights omitted should be allowed
tests.push({
  name: "additionalNights 0 allowed when allowAdditionalNights omitted",
  input: {
    selectedDate: futureISO(12),
    additionalNights: 0,
    // allowAdditionalNights omitted
    isChangeRequest: false,
    allBookings: [],
    userBooking: [],
    daysAvailableToHost: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    futureDays: 365,
    sameDayBooking: true,
    daysInAdvance: 0,
  },
  expected: { status: true, errorMessage: "" },
});

// Test runner
function run() {
  console.log("=".repeat(80));
  console.log("PATCH4 TEST SUITE");
  console.log("=".repeat(80));
  let passed = 0, failed = 0;
  tests.forEach((t, i) => {
    console.log(`Test ${i+1}: ${t.name}`);
    const result = checkAdditionalNightsAvailable(t.input);
    const statusMatch = result.status === t.expected.status;
    const errMatch = (t.expected.errorMessage === undefined) ? true : ((result.errorMessage||"") === (t.expected.errorMessage||""));
    const msgMatch = (t.expected.message === undefined) ? true : ((result.message||"") === (t.expected.message||""));
    console.log("Expected:", t.expected);
    console.log("Actual:  ", result);
    if (statusMatch && errMatch && msgMatch) {
      console.log("PASS"); passed++;
    } else {
      console.log("FAIL");
      if (!statusMatch) console.log(" Status mismatch");
      if (!errMatch) console.log(" Error mismatch");
      if (!msgMatch) console.log(" Message mismatch");
      failed++;
    }
    console.log("");
  });
  console.log("SUMMARY", passed, "passed,", failed, "failed, total", tests.length);
  return { passed, failed, total: tests.length };
}

if (require.main === module) run();
module.exports = { tests, run };
