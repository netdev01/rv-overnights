// Server script for checking additional nights availability
// Compatible with Bubble's toolbox plugin

function checkAdditionalNightsAvailable(input) {
  try {
    // Validate input parameters
    if (!input.selectedDate || !isValidDateString(input.selectedDate)) {
      return {
        status: false,
        errorMessage: "Invalid selected date format. Expected YYYY-MM-DD"
      };
    }

    if (!Number.isInteger(input.additionalNights) || input.additionalNights < 1) {
      return {
        status: false,
        errorMessage: "Additional nights must be a positive integer"
      };
    }

    if (!Array.isArray(input.booking)) {
      return {
        status: false,
        errorMessage: "Booking must be an array of dates"
      };
    }

    if (!Array.isArray(input.userBooking)) {
      return {
        status: false,
        errorMessage: "User booking must be an array of dates"
      };
    }

    if (!Array.isArray(input.daysAvailableToHost)) {
      return {
        status: false,
        errorMessage: "Days available to host must be an array of day names"
      };
    }

    if (!Number.isInteger(input.futureDays) || input.futureDays < 0) {
      return {
        status: false,
        errorMessage: "Future days must be a non-negative integer"
      };
    }

    if (typeof input.sameDayBooking !== 'boolean') {
      return {
        status: false,
        errorMessage: "Same day booking must be a boolean"
      };
    }

    if (!Number.isInteger(input.daysInAdvance) || input.daysInAdvance < 0) {
      return {
        status: false,
        errorMessage: "Days in advance must be a non-negative integer"
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(input.selectedDate + 'T00:00:00');
    const lastPossibleDate = new Date(today);
    lastPossibleDate.setDate(today.getDate() + input.futureDays);

    // Check if selected date is within future booking limit
    if (selectedDate > lastPossibleDate) {
      return {
        status: false,
        errorMessage: `Cannot book more than ${input.futureDays} days in the future`
      };
    }

    // Check advance booking requirement
    const daysDifference = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
    if (daysDifference < input.daysInAdvance) {
      return {
        status: false,
        errorMessage: `Bookings must be made at least ${input.daysInAdvance} days in advance`
      };
    }

    // Check same-day booking policy
    if (!input.sameDayBooking && daysDifference === 0) {
      return {
        status: false,
        errorMessage: "Same-day bookings are not allowed"
      };
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
        return {
          status: false,
          errorMessage: `Hosting not available on ${dayName}`
        };
      }

      // Check existing bookings
      if (input.booking.includes(dateString)) {
        return {
          status: false,
          errorMessage: `Booking conflict: ${dateString} is already booked`
        };
      }

      // Check user bookings
      if (input.userBooking.includes(dateString)) {
        return {
          status: false,
          errorMessage: `You already have a booking on ${dateString}`
        };
      }
    }

    // All checks passed
    return {
      status: true,
      errorMessage: ""
    };

  } catch (error) {
    return {
      status: false,
      errorMessage: `Unexpected error: ${error.message}`
    };
  }
}

// Helper function to validate date string format
function isValidDateString(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const [year, month, day] = dateString.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkAdditionalNightsAvailable };
}

// Example usage for testing
if (typeof require !== 'undefined' && require.main === module) {
  // Test cases from documentation with realistic booking data
  const testCases = [
    {
      selectedDate: "2025-12-15",
      additionalNights: 3,
      booking: ["2025-12-01", "2025-12-02", "2025-12-03", "2025-12-04", "2025-12-05", "2025-12-10", "2025-12-11", "2025-12-20", "2025-12-21"],
      userBooking: ["2025-12-08", "2025-12-09"],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    {
      selectedDate: "2025-12-15",
      additionalNights: 3,
      booking: ["2025-12-01", "2025-12-02", "2025-12-03", "2025-12-04", "2025-12-05", "2025-12-15", "2025-12-16", "2025-12-20", "2025-12-21"],
      userBooking: ["2025-12-08", "2025-12-09"],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    {
      selectedDate: "2025-12-15",
      additionalNights: 3,
      booking: ["2025-12-01", "2025-12-02", "2025-12-03", "2025-12-04", "2025-12-05", "2025-12-10", "2025-12-11", "2025-12-20", "2025-12-21"],
      userBooking: ["2025-12-08", "2025-12-09", "2025-12-16"],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    },
    {
      selectedDate: "2025-12-21",
      additionalNights: 2,
      booking: ["2025-12-01", "2025-12-02", "2025-12-03", "2025-12-04", "2025-12-05", "2025-12-10", "2025-12-11", "2025-12-20"],
      userBooking: ["2025-12-08", "2025-12-09"],
      daysAvailableToHost: ["Monday", "Tuesday", "Wednesday"],
      futureDays: 90,
      sameDayBooking: false,
      daysInAdvance: 2
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`Test Case ${index + 1}:`);
    console.log('Input:', JSON.stringify(testCase, null, 2));
    const result = checkAdditionalNightsAvailable(testCase);
    console.log('Output:', JSON.stringify(result, null, 2));
    console.log('---');
  });
}
