// Frontend version of checkAdditionalNightsAvailable for Bubble's Run Javascript action
// This runs client-side in the browser

function checkAdditionalNightsAvailable(input) {

  console.log('Input received:', JSON.stringify(input, null, 2));

  let status = true;
  let errorMessage = "";
  let message = "";

  try {
    // Handle both JSON strings and parsed objects
    if (typeof input === 'string') {
      try {
        input = JSON.parse(input);
      } catch (parseError) {
        status = false;
        errorMessage = "Invalid JSON input format";
        return { status, message, errorMessage };
      }
    } else if (typeof input !== 'object' || input === null) {
      status = false;
      errorMessage = "Input must be a JSON string or an object";
      return { status, message, errorMessage };
    }

    // Validate input parameters
    if (!input.selectedDate || !isValidDateString(input.selectedDate)) {
      status = false;
      errorMessage = "Invalid selected date format. Expected YYYY-MM-DD";
      return { status, message, errorMessage };
    }

    // Validate allowAdditionalNights (optional, defaults to false)
    const allowAdditionalNights = input.allowAdditionalNights !== undefined ? input.allowAdditionalNights : false;
    if (typeof allowAdditionalNights !== 'boolean') {
      status = false;
      errorMessage = "allowAdditionalNights must be a boolean";
      return { status, message, errorMessage };
    }

    if (!Number.isInteger(input.additionalNights) || input.additionalNights < 0) {
      status = false;
      errorMessage = "Additional nights must be a non-negative integer";
      return { status, message, errorMessage };
    }

    // Enforce allowAdditionalNights policy
    if (!allowAdditionalNights && input.additionalNights > 0) {
      status = false;
      message = "Additional nights are not allowed";
      return { status, message, errorMessage };
    }

    if (typeof input.isChangeRequest !== 'boolean') {
      status = false;
      errorMessage = "isChangeRequest must be a boolean";
      return { status, message, errorMessage };
    }

    if (input.isChangeRequest) {
      if (!input.currentBooking || !input.currentBooking.checkIn || !input.currentBooking.checkout ||
          !isValidDateString(input.currentBooking.checkIn) || !isValidDateString(input.currentBooking.checkout)) {
        status = false;
        errorMessage = "currentBooking must be provided for change requests and must have valid checkIn and checkout dates in YYYY-MM-DD format";
        return { status, message, errorMessage };
      }
    }

    if (!Array.isArray(input.allBookings)) {
      status = false;
      errorMessage = "allBookings must be an array of booking objects";
      return { status, message, errorMessage };
    }

    if (!Array.isArray(input.userBooking)) {
      status = false;
      errorMessage = "userBooking must be an array of booking objects";
      return { status, message, errorMessage };
    }

    if (!Array.isArray(input.daysAvailableToHost)) {
      status = false;
      errorMessage = "Days available to host must be an array of day names";
      return { status, message, errorMessage };
    }

    if (!Number.isInteger(input.futureDays) || input.futureDays < 0) {
      status = false;
      errorMessage = "Future days must be a non-negative integer";
      return { status, message, errorMessage };
    }

    if (typeof input.sameDayBooking !== 'boolean') {
      status = false;
      errorMessage = "Same day booking must be a boolean";
      return { status, message, errorMessage };
    }

    if (!Number.isInteger(input.daysInAdvance) || input.daysInAdvance < 0) {
      status = false;
      errorMessage = "Days in advance must be a non-negative integer";
      return { status, message, errorMessage };
    }

    // Validate space field (optional)
    if (input.space !== undefined && (typeof input.space !== 'number' || input.space < 1 || !Number.isInteger(input.space))) {
      status = false;
      errorMessage = "space must be a positive integer or omitted";
      return { status, message, errorMessage };
    }

    const selectedDateParts = input.selectedDate.split('-').map(Number);
    const selectedYear = selectedDateParts[0];
    const selectedMonth = selectedDateParts[1];
    const selectedDay = selectedDateParts[2];

    const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
    const selectedDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, selectedDay));
    const lastPossibleDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + input.futureDays));

    // Generate all dates to check (includes selectedDate + additionalNights nights)
    const datesToCheck = [];
    for (let i = 0; i <= input.additionalNights; i++) {
      const checkDate = new Date(selectedDate);
      checkDate.setDate(selectedDate.getDate() + i);
      datesToCheck.push(checkDate);
    }

    // Check the entire booking range against future booking limit
    for (const date of datesToCheck) {
      if (date > lastPossibleDate) {
        status = false;
        message = `Cannot book more than ${input.futureDays} days in the future`;
        return { status, message, errorMessage };
      }
    }

    // Parse and validate blocked lists into sets with space filtering
    const blockedYearlySet = new Set(); // "MM-DD" strings (yearly blocks)
    const blockedNotYearSet = new Set(); // "YYYY-MM-DD" strings (non-yearly blocks)
    const invalidBlockedEntries = []; // Combined for clarity since legacy format is removed

    const inputSpace = input.space;

    // Function to check if entry applies to current space (applies if no spaces or includes inputSpace)
    const appliesToSpace = (entry) => {
      if (entry.spaces === undefined) return true;               // no spaces field -> global
      if (!Array.isArray(entry.spaces)) return true;            // malformed -> treat as global
      if (entry.spaces.length === 0) return true;              // empty array -> global (user expectation)
      return entry.spaces.includes(inputSpace);                 // otherwise require inclusion
    };

    // Process blockedYearly (only object format)
    if (Array.isArray(input.blockedYearly)) {
      input.blockedYearly.forEach(entry => {
        if (typeof entry === 'object' && entry !== null && entry.start && entry.end) {
          if (!appliesToSpace(entry)) return; // skip if not for this space
          if (!isValidDateString(entry.start) || !isValidDateString(entry.end)) {
            // For object entries, store their JSON string; for primitives this branch won't run
            invalidBlockedEntries.push(JSON.stringify(entry));
            return;
          }
          const startMMDD = generateMMDD(entry.start);
          const endMMDD = generateMMDD(entry.end);
          const mmddRange = generateMMDDRange(startMMDD, endMMDD);
          mmddRange.forEach(mmdd => blockedYearlySet.add(mmdd));
        } else {
          // If entry is a primitive (e.g., a string), store it as-is so JSON.stringify later produces ["value"]
          if (typeof entry === 'string') {
            invalidBlockedEntries.push(entry);
          } else {
            invalidBlockedEntries.push(JSON.stringify(entry));
          }
        }
      });
    }

    // Process blockedNoYearly (only object format)
    if (Array.isArray(input.blockedNoYearly)) {
      input.blockedNoYearly.forEach(entry => {
        if (typeof entry === 'object' && entry !== null && entry.start && entry.end) {
          if (!appliesToSpace(entry)) return; // skip if not for this space
          if (!isValidDateString(entry.start) || !isValidDateString(entry.end)) {
            // For object entries, store their JSON string
            invalidBlockedEntries.push(JSON.stringify(entry));
            return;
          }
          const dates = generateInclusiveDateRange(entry.start, entry.end);
          dates.forEach(date => blockedNotYearSet.add(date));
        } else {
          // If entry is a primitive (e.g., a string), store it as-is so JSON.stringify later produces ["value"]
          if (typeof entry === 'string') {
            invalidBlockedEntries.push(entry);
          } else {
            invalidBlockedEntries.push(JSON.stringify(entry));
          }
        }
      });
    }

    // Record validation errors in errorMessage and set user message
    if (invalidBlockedEntries.length > 0) {
      errorMessage += (errorMessage ? ' ' : '') + `Ignored invalid blocked entries: ${JSON.stringify(invalidBlockedEntries)}`;
      message = "Some blocked dates were ignored due to invalid format";
    }

    // Check blocked dates (before other checks for better error messages)
    for (const date of datesToCheck) {
      const dateString = date.toISOString().split('T')[0];
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mmddHyphen = `${mm}-${dd}`; // blockedYearlySet uses hyphen format
      if (blockedNotYearSet.has(dateString) || blockedYearlySet.has(mmddHyphen)) {
        status = false;
        message = `Date blocked: ${dateString}`;
        return { status, message, errorMessage };
      }
    }

    // Calculate days difference for validation checks
    const daysDifference = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));

    // Check same-day booking policy first (before advance booking check)
    if (!input.sameDayBooking && daysDifference === 0) {
      status = false;
      message = "Same-day bookings are not allowed";
      return { status, message, errorMessage };
    }

    // Check advance booking requirement
    if (daysDifference < input.daysInAdvance) {
      status = false;
      message = `Bookings must be made at least ${input.daysInAdvance} days in advance`;
      return { status, message, errorMessage };
    }

    // Convert booking ranges to individual dates
    const flatAllBookings = new Set();
    for (const booking of input.allBookings) {
      if (!booking.checkIn || !booking.checkout || !isValidDateString(booking.checkIn) || !isValidDateString(booking.checkout)) {
        status = false;
        errorMessage = "Invalid booking range format. Each booking must have checkIn and checkout dates in YYYY-MM-DD format";
        return { status, errorMessage };
      }
      const dates = generateDateRange(booking.checkIn, booking.checkout);
      dates.forEach(date => flatAllBookings.add(date));
    }

    const flatUserBookings = new Set();
    for (const booking of input.userBooking) {
      if (!booking.checkIn || !booking.checkout || !isValidDateString(booking.checkIn) || !isValidDateString(booking.checkout)) {
        status = false;
        errorMessage = "Invalid user booking range format. Each booking must have checkIn and checkout dates in YYYY-MM-DD format";
        return { status, errorMessage };
      }
      const dates = generateDateRange(booking.checkIn, booking.checkout);
      dates.forEach(date => flatUserBookings.add(date));
    }

    // For change requests, exclude the current booking dates from conflict checking
    if (input.isChangeRequest) {
      const originalDates = generateDateRange(input.currentBooking.checkIn, input.currentBooking.checkout);
      // Remove current booking dates from both sets to allow modification
      originalDates.forEach(date => {
        flatAllBookings.delete(date);
        flatUserBookings.delete(date);
      });
    }

    // Check each date
    for (const date of datesToCheck) {
      const dateString = date.toISOString().split('T')[0];

      // Check day of week availability
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      if (!input.daysAvailableToHost.includes(dayName)) {
        status = false;
        message = `Hosting not available on ${dayName}`;
        return { status, message, errorMessage };
      }

      // Check user bookings first
      if (flatUserBookings.has(dateString)) {
        status = false;
        message = `You already have a booking on ${dateString}`;
        return { status, message, errorMessage };
      }

      // Check existing bookings
      if (flatAllBookings.has(dateString)) {
        status = false;
        message = `Booking conflict: ${dateString} is already booked`;
        return { status, message, errorMessage };
      }
    }

    return { status, message, errorMessage };
  } catch (error) {
    status = false;
    message = "An unexpected error occurred";
    errorMessage = `Unexpected error: ${error.message}`;
    return { status, message, errorMessage };
  }
}

// Helper function to validate date string format
function isValidDateString(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const dateParts = dateString.split('-').map(Number);
  const year = dateParts[0];
  const month = dateParts[1];
  const day = dateParts[2];
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
}

// Helper function to generate all dates in a range (inclusive of checkIn, exclusive of checkout)
function generateDateRange(checkIn, checkout) {
  const dates = [];
  const startParts = checkIn.split('-').map(Number);
  const startYear = startParts[0];
  const startMonth = startParts[1];
  const startDay = startParts[2];

  const endParts = checkout.split('-').map(Number);
  const endYear = endParts[0];
  const endMonth = endParts[1];
  const endDay = endParts[2];

  const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));

  const currentDate = new Date(startDate);
  while (currentDate < endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return dates;
}

// Helper function to extract MM-DD from YYYY-MM-DD
function generateMMDD(dateString) {
  const parts = dateString.split('-');
  return `${parts[1]}-${parts[2]}`; // MM-DD
}

// Helper function to generate MM-DD range, handling year wrap inclusive
function generateMMDDRange(startMMDD, endMMDD) {
  const mmdds = new Set();
  const [startM, startD] = startMMDD.split('-').map(Number);
  const [endM, endD] = endMMDD.split('-').map(Number);

  // To handle year wrap, we can simulate dates within a single arbitrary year (e.g., 2000)
  // and then extract the MM-DD parts.
  const startTempDate = new Date(Date.UTC(2000, startM - 1, startD));
  const endTempDate = new Date(Date.UTC(2000, endM - 1, endD));

  // If end date is chronologically before start date in the same year, it means it wraps to the next year.
  if (endTempDate < startTempDate) {
    endTempDate.setUTCFullYear(2001); // Adjust to next year for correct iteration
  }

  let currentDate = new Date(startTempDate);
  while (currentDate <= endTempDate) {
    const mm = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getUTCDate()).padStart(2, '0');
    mmdds.add(`${mm}-${dd}`);
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return Array.from(mmdds).sort();
}

// Helper function to generate inclusive date range
function generateInclusiveDateRange(start, end) {
  const dates = [];
  const startParts = start.split('-').map(Number);
  const endParts = end.split('-').map(Number);
  const startYear = startParts[0];
  const startMonth = startParts[1];
  const startDay = startParts[2];
  const endYear = endParts[0];
  const endMonth = endParts[1];
  const endDay = endParts[2];

  const startDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const endDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) { // inclusive now
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return dates;
}

// Export for Node.js environments (does not affect browser usage)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkAdditionalNightsAvailable, isValidDateString, generateDateRange, generateMMDD, generateMMDDRange, generateInclusiveDateRange };
}
