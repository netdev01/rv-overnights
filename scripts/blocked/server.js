// Server script for Bubble's toolbox plugin

function getBlockedDates(input) {
  const targetSpaces = input.space.filter(s => s).map(s => String(s));
  const dateMap = {};

  // Process each block
  input.blocked.forEach(block => {
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
    const isFullyBlocked = hasGlobal || targetSpaces.every(s => blockedSpaces.has(s));
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

  // Sort noYear by MMDD
  const outputlist1 = Array.from(noYearSet).sort((a, b) => {
    const [aMm, aDd] = a.split('/');
    const [bMm, bDd] = b.split('/');
    return (parseInt(aMm) * 100 + parseInt(aDd)) - (parseInt(bMm) * 100 + parseInt(bDd));
  });

  // Sort withYear by full date
  const outputlist2 = Array.from(withYearSet).sort((a, b) => {
    const [aMm, aDd, aYy] = a.split('/');
    const [bMm, bDd, bYy] = b.split('/');
    return new Date(`20${aYy}`, aMm - 1, aDd) - new Date(`20${bYy}`, bMm - 1, bDd);
  });

  return { outputlist1, outputlist2 };
};

// Example usage (for testing)
const input = {
  "space": [1, 2],
  "blocked": [
    {"yearly": true, "start date": "10/01/2024", "end date": "10/02/2024"},
    {"yearly": true, "space": ["1"], "start date": "10/03/2025", "end date": "10/04/2025"},
    {"yearly": true, "space": ["2"], "start date": "10/03/2025", "end date": "10/04/2025"},
    {"yearly": false, "space": ["1"], "start date": "10/11/2025", "end date": "10/12/2025"},
    {"yearly": false, "space": ["2"], "start date": "10/11/2025", "end date": "10/12/2025"},
    {"yearly": true, "space": ["1"], "start date": "10/21/2024", "end date": "10/22/2024"}
  ]
};

const result = getBlockedDates(input);
console.log('Result:', result);

const expected = {
  outputlist1: ["10/01", "10/02", "10/03", "10/04"],
  outputlist2: ["10/11/25", "10/12/25"]
};

const isCorrect = JSON.stringify(result) === JSON.stringify(expected) ||
  (result.outputlist1.sort().join() === expected.outputlist1.join() &&
   result.outputlist2.sort().join() === expected.outputlist2.join());

console.log('Test passed:', isCorrect);
