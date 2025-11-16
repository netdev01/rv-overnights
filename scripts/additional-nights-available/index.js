// Server script for checking additional nights availability

/* How to use it i sever side script in Bubble.
var input = properties.thing1;
var result = checkAdditionalNightsAvailable(input);

return {
    output1: result.status,    
    output2: result.message,  
    output3: result.errorMessage,  
};
 */

function checkAdditionalNightsAvailable(input) {

  console.log('Input received:', JSON.stringify(input, null, 2));

  const MAX_BOOKING_YEAR_DIFFERENCE = 1; // Maximum calendar years in the future bookings are allowed

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
    }
    // Validate input parameters
    if (!input.selectedDate || !isValidDateString(input.selectedDate)) {
      status = false;
      errorMessage = "Invalid selected date format. Expected YYYY-MM-DD";
      return { status, message, errorMessage };
    }

    if (!Number.isInteger(input.additionalNights) || input.additionalNights < 1) {
      status = false;

      errorMessage = "Additional nights must be a positive integer";
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
    const lastAllowedCalendarDate = new Date(Date.UTC(today.getUTCFullYear() + MAX_BOOKING_YEAR_DIFFERENCE, today.getUTCMonth(), today.getUTCDate()));

    // Parse and validate blocked lists into sets with space filtering
    const blockedYearlySet = new Set(); // "MM-DD" strings (yearly blocks)
    const blockedNotYearSet = new Set(); // "YYYY-MM-DD" strings (non-yearly blocks)
    const invalidYearlyEntries = [];
    const invalidNotYearlyEntries = [];

    const inputSpace = input.space; // optional

    // Function to check if entry applies to current space (applies if no spaces or includes inputSpace)
    const appliesToSpace = (entry) => {
      if (entry.spaces === undefined) return true;               // no spaces field -> global
      if (!Array.isArray(entry.spaces)) return true;            // malformed -> treat as global
      if (entry.spaces.length === 0) return true;              // empty array -> global (user expectation)
      return entry.spaces.includes(inputSpace);                 // otherwise require inclusion
    };

    // Process blockedYearly
    if (Array.isArray(input.blockedYearly)) {
      input.blockedYearly.forEach(entry => {
        if (typeof entry === 'string') {
          // Legacy string format
          const str = entry.trim();
          if (!/^\d{1,2}[\/-]\d{1,2}$/.test(str)) {
            invalidYearlyEntries.push(str);
            return;
          }
          const parts = str.split(/[/]/).length === 2 ? str.split('/') : str.split('-');
          const mm = Number(parts[0]);
          const dd = Number(parts[1]);
          if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
            invalidYearlyEntries.push(str);
            return;
          }
          // Valid - normalize to MM-DD
          blockedYearlySet.add(`${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`);
        } else if (typeof entry === 'object' && entry.start && entry.end) {
          // New object format
          if (!appliesToSpace(entry)) return; // skip if not for this space
          if (!isValidDateString(entry.start) || !isValidDateString(entry.end)) {
            invalidYearlyEntries.push(JSON.stringify(entry));
            return;
          }
          const startMMDD = generateMMDD(entry.start);
          const endMMDD = generateMMDD(entry.end);
          const mmddRange = generateMMDDRange(startMMDD, endMMDD);
          mmddRange.forEach(mmdd => blockedYearlySet.add(mmdd));
        } else {
          invalidYearlyEntries.push(JSON.stringify(entry));
        }
      });
    }

    // Process blockedNoYearly
    if (Array.isArray(input.blockedNoYearly)) {
      input.blockedNoYearly.forEach(entry => {
        if (typeof entry === 'string') {
          // Legacy string format
          const str = entry.trim();
          let year, mm, dd;
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            [year, mm, dd] = str.split('-').map(Number);
          } else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(str)) {
            const parts = str.split('/');
            mm = Number(parts[0]);
            dd = Number(parts[1]);
            let yy = parts[2];
            year = yy.length === 4 ? Number(yy) : Number('20' + yy);
          } else {
            invalidNotYearlyEntries.push(str);
            return;
          }
          if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || year < 1 || year > 9999) {
            invalidNotYearlyEntries.push(str);
            return;
          }
          const testDate = new Date(year, mm - 1, dd);
          if (testDate.getFullYear() !== year || testDate.getMonth() !== mm - 1 || testDate.getDate() !== dd) {
            invalidNotYearlyEntries.push(str);
            return;
          }
          const normalized = `${String(year).padStart(4,'0')}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
          blockedNotYearSet.add(normalized);
        } else if (typeof entry === 'object' && entry.start && entry.end) {
          // New object format - expand inclusive range
          if (!appliesToSpace(entry)) return; // skip if not for this space
          if (!isValidDateString(entry.start) || !isValidDateString(entry.end)) {
            invalidNotYearlyEntries.push(JSON.stringify(entry));
            return;
          }
          const dates = generateInclusiveDateRange(entry.start, entry.end);
          dates.forEach(date => blockedNotYearSet.add(date));
        } else {
          invalidNotYearlyEntries.push(JSON.stringify(entry));
        }
      });
    }

    // Record validation errors in errorMessage and set user message
    if (invalidYearlyEntries.length > 0 || invalidNotYearlyEntries.length > 0) {
      const errors = [];
      if (invalidYearlyEntries.length > 0) {
        errors.push(`Ignored invalid blockedYearly entries: [${invalidYearlyEntries.map(s => `'${s}'`).join(', ')}]`);
      }
      if (invalidNotYearlyEntries.length > 0) {
        errors.push(`Ignored invalid blockedNoYearly entries: [${invalidNotYearlyEntries.map(s => `'${s}'`).join(', ')}]`);
      }
      errorMessage += (errorMessage ? ' ' : '') + errors.join(' ');
      message = "Some blocked dates were ignored due to invalid format";
    }

    // Check if selected date is within future booking limit
    if (selectedDate > lastPossibleDate) {
      status = false;
      errorMessage = `Cannot book more than ${input.futureDays} days in the future`;
      return { status, message, errorMessage };
    }

    // Generate all dates to check (includes selectedDate + additionalNights nights)
    const datesToCheck = [];
    for (let i = 0; i <= input.additionalNights; i++) {
      const checkDate = new Date(selectedDate);
      checkDate.setDate(selectedDate.getDate() + i);
      datesToCheck.push(checkDate);
    }

    // Check if any date is beyond the 1-year calendar limit
    for (const date of datesToCheck) {
      if (date > lastAllowedCalendarDate) {
        status = false;
        errorMessage = `Cannot book more than ${MAX_BOOKING_YEAR_DIFFERENCE} year(s) in the future`;
        return { status, message, errorMessage };
      }
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
      errorMessage = "Same-day bookings are not allowed";
      return { status, errorMessage };
    }

    // Check advance booking requirement
    if (daysDifference < input.daysInAdvance) {
      status = false;
      errorMessage = `Bookings must be made at least ${input.daysInAdvance} days in advance`;
      return { status, errorMessage };
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
        errorMessage = `Hosting not available on ${dayName}`;
        return { status, errorMessage };
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

  if (startMMDD <= endMMDD) {
    // Same year
    let m = startM;
    let d = startD;
    while (m <= endM) {
      const maxD = m === endM ? endD : 31; // rough
      while (d <= maxD) {
        mmdds.add(`${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
        d++;
      }
      d = 1;
      m++;
    }
  } else {
    // Wrap around
    // From start to 12-31
    let m = startM;
    let d = startD;
    while (m <= 12) {
      const maxD = 31;
      while (d <= maxD) {
        mmdds.add(`${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
        d++;
      }
      d = 1;
      m++;
    }
    // From 01-01 to end
    m = 1;
    d = 1;
    while (m <= endM) {
      const maxD = m === endM ? endD : 31;
      while (d <= maxD) {
        mmdds.add(`${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
        d++;
      }
      d = 1;
      m++;
    }
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

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkAdditionalNightsAvailable, isValidDateString, generateDateRange };
}
