Create a JS function that will be called by client-side JS in Bubble's Run Javascript action.
It takes in the following JSON with two operational modes:

**Any Space Mode** (when selectSpace is omitted):
Returns dates where ANY of the specified spaces are blocked.

**Single Space Mode** (when selectSpace is provided):
Returns dates where the specified single space is blocked.

Example input:
{
    "spaces": [1, 2],
    "selectSpace": 1, // optional - enables single space mode
    "blocked": [
        {
            "yearly": true,
            "start date": "10/01/2024",
            "end date": "10/02/2024"
        },
        {
            "yearly": true,
            "space": ["1"],
            "start date": "10/03/2025",
            "end date": "10/04/2025"
        },
        {
            "yearly": true,
            "space": ["2"],
            "start date": "10/03/2025",
            "end date": "10/04/2025"
        },
        {
            "yearly": false,
            "space": ["1"],
            "start date": "10/11/2025",
            "end date": "10/12/2025"
        },
        {
            "yearly": false,
            "space": ["2"],
            "start date": "10/11/2025",
            "end date": "10/12/2025"
        },
        {
            "yearly": true,
            "space": ["1"],
            "start date": "10/21/2024",
            "end date": "10/22/2024"
        }
    ]
}

It returns blocked dates as 2 lists of text dates: 1 with year (mm/dd/yy) and with no year (mm/dd).
It should return
- datesYearly = ["10/01", "10/02", "10/03", "10/04"] for blocked dates with no year (yearly = true)
- datesNotYearly = ["10/11/25", "10/12/25"] for blocked dates with year (yearly = false)

## Purpose
The Bubble Run JavaScript action processes reservation block data to identify dates where spaces are blocked. It supports two operational modes: "Any Space" mode (returns dates where ANY specified space is blocked) and "Single Space" mode (returns dates where only the specified space is blocked). It generates two sorted lists of blocked dates in text format for use in the RV overnights application.

## Design
- Execution: Client-side JavaScript in Bubble's Run JavaScript action.
- Dependencies: Standard JavaScript Date, Set, and string methods (no external packages).
- Error Handling: Relies on Bubble's script wrapper; errors are logged.
- Timezone Handling: Uses UTC for date calculations to avoid local timezone shifts.
- Assumptions: Dates are in MM/DD/YYYY format. Yearly blocks recur without year; non-yearly blocks include year.

## Input
- Data Type: JSON object or string passed as input to the function.
- Structure:
  ```
  {
    "spaces": [list of space IDs (numbers or strings)], // required in any space mode
    "selectSpace": number, // optional - enables single space mode
    "blocked": [
      {
        "yearly": true/false (boolean),
        "start date": "MM/DD/YYYY",
        "end date": "MM/DD/YYYY",
        "space": optional array of space IDs (if omitted, global)
      }, ...
    ]
  }
  ```
- Validation: Function assumes valid dates and structure; no input validation included.

## Output
- Return Type: { datesYearly: [list of text], datesNotYearly: [list of text] }
- datesYearly: Dates blocked by yearly blocks, formatted "MM/DD".
- datesNotYearly: Dates blocked by non-yearly blocks, formatted "MM/DD/YY".
- Sorting: datesYearly by month/day order; datesNotYearly chronological by full date.
- Deduplication: Automatic via Set usage.

## Logic Design
1. Parse input: Extract spaces array and optional selectSpace, plus block list.
2. Process blocks:
   - For each block, parse start/end dates as UTC Date objects.
   - Expand inclusive date range (start to end) in UTC.
   - For each date in range:
     - Track blocked spaces per date (add specific spaces or mark as global).
     - Mark yearly/non-yearly status based on block type.
3. Filter blocked dates based on operational mode:
   - **Any Space Mode** (selectSpace omitted): Date blocked if any target space is blocked (global OR spaces.some(space => blockedSpaces.has(space)))
   - **Single Space Mode** (selectSpace provided): Date blocked if global OR selectSpace is in blockedSpaces
4. Classify per date: If any contributing block is non-yearly, treat as non-yearly; else yearly.
5. Format dates:
   - Yearly: MM/DD from date string.
   - Non-yearly: MM/DD/YY (YY = full year % 100).
6. Dedupe and sort: Use Set for uniqueness, then sort as specified.
7. Return { datesYearly: [...], datesNotYearly: [...] }.

## Bubble Script Usage
```javascript
// Any space mode
const input1 = { spaces: [1, 2], blocked: [...] };
const result1 = getBlockedDates(input1);

// Single space mode
const input2 = { spaces: [1, 2], selectSpace: 1, blocked: [...] };
const result2 = getBlockedDates(input2);

// result: { datesYearly: [...], datesNotYearly: [...] }
```
