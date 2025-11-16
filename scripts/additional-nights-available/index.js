// Server script for checking additional nights availability
// Compatible with Bubble's toolbox plugin

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

    const selectedDateParts = input.selectedDate.split('-').map(Number);
    const selectedYear = selectedDateParts[0];
    const selectedMonth = selectedDateParts[1];
    const selectedDay = selectedDateParts[2];

    const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
    const selectedDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, selectedDay));
    const lastPossibleDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + input.futureDays));
    const lastAllowedCalendarDate = new Date(Date.UTC(today.getUTCFullYear() + MAX_BOOKING_YEAR_DIFFERENCE, today.getUTCMonth(), today.getUTCDate()));

    // Parse and validate blocked lists into sets
    const blockedYearlySet = new Set(); // "MM-DD" strings (yearly blocks)
    const blockedNotYearSet = new Set(); // "YYYY-MM-DD" strings (non-yearly blocks)
    const invalidYearlyEntries = [];
    const invalidNotYearlyEntries = [];

    // Validate blockedYearly: MM/DD or MM-DD format
    if (Array.isArray(input.blockedYearly)) {
      input.blockedYearly.forEach(s => {
        const str = String(s).trim();
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
        // Valid - normalize to MM-DD regardless of input format
        blockedYearlySet.add(`${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`);
      });
    }

    // Validate blockedNoYearly: MM/DD/YY, MM/DD/YYYY, or YYYY-MM-DD format (for compatibility)
    if (Array.isArray(input.blockedNoYearly)) {
      input.blockedNoYearly.forEach(s => {
        const str = String(s).trim();
        let year, mm, dd;
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
          // YYYY-MM-DD format
          [year, mm, dd] = str.split('-').map(Number);
        } else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(str)) {
          // MM/DD/YY or MM/DD/YYYY format
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
        // Validate full date
        const testDate = new Date(year, mm - 1, dd);
        if (testDate.getFullYear() !== year ||
            testDate.getMonth() !== mm - 1 ||
            testDate.getDate() !== dd) {
          invalidNotYearlyEntries.push(str);
          return;
        }
        // Valid - normalize to YYYY-MM-DD
        const normalized = `${String(year).padStart(4,'0')}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
        blockedNotYearSet.add(normalized);
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
        errorMessage = `You already have a booking on ${dateString}`;
        return { status, errorMessage };
      }

      // Check existing bookings
      if (flatAllBookings.has(dateString)) {
        status = false;
        errorMessage = `Booking conflict: ${dateString} is already booked`;
        return { status, errorMessage };
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

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkAdditionalNightsAvailable, isValidDateString, generateDateRange };
}
