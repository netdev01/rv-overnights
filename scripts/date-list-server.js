// Server script for generating a list of dates between start and end dates

function getDateList(startDate, endDate, interval = 1) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const dates = [];

  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + interval)) {
    dates.push(new Date(dt));
  }

  return { date_list: dates };
};

// Example usage (for testing)
const result = getDateList("2024-01-01", "2024-01-05");
console.log('Result:', result);

// Expected output: dates from 2024-01-01 to 2024-01-05 (daily)
