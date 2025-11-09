// Server script for checking additional nights availability
// Compatible with Bubble's toolbox plugin

function checkAdditionalNightsAvailable(input) {
  let status = true;
  let errorMessage = "";

  try {
    // Handle both JSON strings and parsed objects
    if (typeof input === 'string') {
      try {
        input = JSON.parse(input);
      } catch (parseError) {
        status = false;
        errorMessage = "Invalid JSON input format";
        return { status, errorMessage };
      }
    }
    // Validate input parameters
    if (!input.selectedDate || !isValidDateString(input.selectedDate)) {
      status = false;
      errorMessage = "Invalid selected date format. Expected YYYY-MM-DD";
      return { status, errorMessage };
    }

    if (!Number.isInteger(input.additionalNights) || input.additionalNights < 1) {
      status = false;
      errorMessage = "Additional nights must be a positive integer";
      return { status, errorMessage };
    }

    if (typeof input.isChangeRequest !== 'boolean') {
      status = false;
      errorMessage = "isChangeRequest must be a boolean";
      return { status, errorMessage };
    }

    if (input.isChangeRequest) {
      if (!input.currentBooking || !input.currentBooking.checkIn || !input.currentBooking.checkout ||
          !isValidDateString(input.currentBooking.checkIn) || !isValidDateString(input.currentBooking.checkout)) {
        status = false;
        errorMessage = "currentBooking must be provided for change requests and must have valid checkIn and checkout dates in YYYY-MM-DD format";
        return { status, errorMessage };
      }
    }

    if (!Array.isArray(input.allBookings)) {
      status = false;
      errorMessage = "allBookings must be an array of booking objects";
      return { status, errorMessage };
    }

    if (!Array.isArray(input.userBooking)) {
      status = false;
      errorMessage = "userBooking must be an array of booking objects";
      return { status, errorMessage };
    }

    if (!Array.isArray(input.daysAvailableToHost)) {
      status = false;
      errorMessage = "Days available to host must be an array of day names";
      return { status, errorMessage };
    }

    if (!Number.isInteger(input.futureDays) || input.futureDays < 0) {
      status = false;
      errorMessage = "Future days must be a non-negative integer";
      return { status, errorMessage };
    }

    if (typeof input.sameDayBooking !== 'boolean') {
      status = false;
      errorMessage = "Same day booking must be a boolean";
      return { status, errorMessage };
    }

    if (!Number.isInteger(input.daysInAdvance) || input.daysInAdvance < 0) {
      status = false;
      errorMessage = "Days in advance must be a non-negative integer";
      return { status, errorMessage };
    }

    const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

    const selectedDateParts = input.selectedDate.split('-').map(Number);
    const selectedYear = selectedDateParts[0];
    const selectedMonth = selectedDateParts[1];
    const selectedDay = selectedDateParts[2];
    const selectedDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, selectedDay));
    const lastPossibleDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + input.futureDays));

    // Check if selected date is within future booking limit
    if (selectedDate > lastPossibleDate) {
      status = false;
      errorMessage = `Cannot book more than ${input.futureDays} days in the future`;
      return { status, errorMessage };
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

    // Generate all dates to check
    const datesToCheck = [];
    for (let i = 0; i < input.additionalNights; i++) {
      const checkDate = new Date(selectedDate);
      checkDate.setDate(selectedDate.getDate() + i);
      datesToCheck.push(checkDate);
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

      // Check existing bookings
      if (flatAllBookings.has(dateString)) {
        status = false;
        errorMessage = `Booking conflict: ${dateString} is already booked`;
        return { status, errorMessage };
      }

      // Check user bookings
      if (flatUserBookings.has(dateString)) {
        status = false;
        errorMessage = `You already have a booking on ${dateString}`;
        return { status, errorMessage };
      }
    }

    return { status, errorMessage };
  } catch (error) {
    status = false;
    errorMessage = `Unexpected error: ${error.message}`;
    return { status, errorMessage };
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
