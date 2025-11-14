// Frontend version of getBlockedDates for Bubble's Run Javascript action
// This runs client-side in the browser

// Frontend version of getBlockedDates for Bubble's Run Javascript action
// Input is JSON string from properties.param1

// Note: If properties.param1 is JSON string, parse it; if it's already object, use directly
function getBlockedDates(input) {
  // Debug: Log the raw input immediately
  console.log('input:', input);
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch (parseError) {
      return {
        datesYearly: [],
        datesNotYearly: [],
        errorMessage: "Invalid JSON input format"
      };
    }
  } else {
    // Assume it's already a parsed object
    data = input;
  }
  console.log('Parsed input:', data);
  const targetSpaces = (data.spaces || []).filter(s => s).map(s => String(s));
  const selectedSpace = (data.selectSpace != null) ? String(data.selectSpace) : null;
  console.log('Target spaces:', targetSpaces);
  console.log('Selected space:', selectedSpace);
  const dateMap = {};

  // Process each block
  (data.blocked || []).forEach(block => {
    const [m, d, y] = block['start date'].split('/').map(s => parseInt(s));
    const [em, ed, ey] = block['end date'].split('/').map(s => parseInt(s));
    let year = y < 100 ? y + 2000 : y;
    let endYear = ey < 100 ? ey + 2000 : ey;
    const start = new Date(Date.UTC(year, m - 1, d));
    const end = new Date(Date.UTC(endYear, em - 1, ed));
    let currentMs = start.getTime();
    const endMs = end.getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    while (currentMs <= endMs) {
      const dateStr = new Date(currentMs).toISOString().split('T')[0];
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { blockedSpaces: new Set(), hasGlobal: false, isYearly: true };
      }
      if (block.space && block.space.length > 0) {
        block.space.forEach(s => dateMap[dateStr].blockedSpaces.add(String(s)));
      } else {
        dateMap[dateStr].hasGlobal = true;
      }
      // If any block is non-yearly, mark as non-yearly
      if (block.yearly === 'no' || block.yearly === false) {
        dateMap[dateStr].isYearly = false;
      }
      currentMs += dayMs;
    }
  });

  const noYearSet = new Set();
  const withYearSet = new Set();

  // Check dates and format
  for (const dateStr in dateMap) {
    const { blockedSpaces, hasGlobal, isYearly } = dateMap[dateStr];
    const isFullyBlocked = selectedSpace
      ? (hasGlobal || blockedSpaces.has(selectedSpace))
      : (hasGlobal || targetSpaces.some(s => blockedSpaces.has(s)));
    if (isFullyBlocked) {
      const date = new Date(dateStr);
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const yy = (date.getFullYear() % 100).toString().padStart(2, '0');
      if (isYearly) {
        noYearSet.add(`${mm}/${dd}`);
      } else {
        withYearSet.add(`${mm}/${dd}/${yy}`);
      }
    }
  }

  // Sort yearly dates by MMDD
  const datesYearly = Array.from(noYearSet).sort((a, b) => {
    const [aMm, aDd] = a.split('/');
    const [bMm, bDd] = b.split('/');
    return (parseInt(aMm) * 100 + parseInt(aDd)) - (parseInt(bMm) * 100 + parseInt(bDd));
  });

  // Sort non-yearly dates by full date
  const datesNotYearly = Array.from(withYearSet).sort((a, b) => {
    const [aMm, aDd, aYy] = a.split('/');
    const [bMm, bDd, bYy] = b.split('/');
    return new Date(`20${aYy}`, aMm - 1, aDd) - new Date(`20${bYy}`, bMm - 1, bDd);
  });

  const result = { datesYearly, datesNotYearly };
  console.log('Final result:', result);
  return result;
}

// Export for Node.js testing (does not affect browser usage)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getBlockedDates };
}

// Example usage for testing (run in browser console)
// const input = {
//   "space": [1, 2],
//   "blocked": [
//     {"yearly": true, "start date": "10/01/2024", "end date": "10/02/2024"},
//     {"yearly": true, "space": ["1"], "start date": "10/03/2025", "end date": "10/04/2025"},
//     {"yearly": true, "space": ["2"], "start date": "10/03/2025", "end date": "10/04/2025"},
//     {"yearly": false, "space": ["1"], "start date": "10/11/2025", "end date": "10/12/2025"},
//     {"yearly": false, "space": ["2"], "start date": "10/11/2025", "end date": "10/12/2025"},
//     {"yearly": true, "space": ["1"], "start date": "10/21/2024", "end date": "10/22/2024"}
//   ]
// };
// const jsonString = JSON.stringify(input);
// const result = getBlockedDates(jsonString);
// console.log(result);

// For Bubble Run Javascript action: with param1 set to the JSON string
// const result = getBlockedDates(properties.param1);
// bubble_fn_blocked_dates({datesYearly: result.datesYearly, datesNotYearly: result.datesNotYearly});

// Usage in Bubble:
// const result = getBlockedDates(properties.param1);
// bubble_fn_blocked_dates({datesYearly: result.datesYearly, datesNotYearly: result.datesNotYearly});
