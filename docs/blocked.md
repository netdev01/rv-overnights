Rdad server-script.md.
Create a JS function that will be called by server side JS in Bubble's toolbox plugin. 
It takes in the following json.
{
    "space": [1, 2],
    "blocked": [
        {
            "yearly": yes,
            "start date": "10/01/2024",
            "end date": "10/02/2024"
        },,
        {
            "yearly": yes,
            "space": ["1"],
            "start date": "10/03/2025",
            "end date": "10/04/2025"
        },
        {
            "yearly": yes,
            "space": ["2"],
            "start date": "10/03/2025",
            "end date": "10/04/2025"
        }
        {
            "yearly": no,
            "space": ["1"],
            "start date": "10/11/2025",
            "end date": "10/12/2025"
        },
        {
            "yearly": no,
            "space": ["2"],
            "start date": "10/11/2025",
            "end date": "10/12/2025"
        }
        {
            "yearly": yes,
            "space": ["1"],
            "start date": "10/21/2024",
            "end date": "10/22/2024"
        }
    ]
}

It returns blocked dates as 2 lists of text dates: 1 with year (mm/dd/yy) and with no year (mm/dd).
It should return 
- outputlist1 = ["10/01", "10/02", "10/03", "10/04"] for blocked dates with no year (yearly = yes)
- outputlist2 = ["10/11/25", "10/12/25"] for blocked dates with year (yearly = no)

## Purpose
The Bubble server script processes reservation block data to identify dates where all specified spaces are blocked. It generates two sorted lists of blocked dates in text format for use in the RV overnights application.

## Design
- Execution: Asnyc Node.js AWS Lambda function in Bubble's toolbox plugin.
- Dependencies: Standard JavaScript Date, Set, and string methods (no external packages).
- Error Handling: Relies on Bubble's script wrapper; errors are logged.
- Timezone Handling: Uses UTC for date calculations to avoid local timezone shifts.
- Assumptions: Dates are in MM/DD/YYYY format. Yearly blocks recur without year; non-yearly blocks include year.

## Input
- Data Type: JSON string passed as `data` in Bubble script.
- Structure:
  ```
  {
    "space": [list of space IDs (numbers or strings)],
    "blocked": [
      {
        "yearly": "yes" or "no" (or boolean true/false),
        "start date": "MM/DD/YYYY",
        "end date": "MM/DD/YYYY",
        "space": optional array of space IDs (if omitted, global)
      }, ...
    ]
  }
  ```
- Validation: Function assumes valid dates and structure; no input validation included.

## Output
- Return Type: { outputlist1: [list of text], outputlist2: [list of text] }
- outputlist1: Dates blocked by yearly ("yes") blocks, formatted "MM/DD".
- outputlist2: Dates blocked by non-yearly ("no") blocks, formatted "MM/DD/YY".
- Sorting: outputlist1 by month/day order; outputlist2 chronological by full date.
- Deduplication: Automatic via Set usage.

## Logic Design
1. Parse input: Extract target spaces and block list.
2. Process blocks:
   - For each block, parse start/end dates as UTC Date objects.
   - Expand inclusive date range (start to end) in UTC.
   - For each date in range:
     - Track blocked spaces (add specific space or mark global).
     - If block is non-yearly, mark date as non-yearly.
3. Filter fully blocked dates: A date is blocked if all target spaces are covered (global or specific space list contains all).
4. Classify per date: If any contributing block is non-yearly, treat as non-yearly; else yearly.
5. Format dates:
   - noYear: MM/DD from date string.
   - withYear: MM/DD/YY (YY = full year % 100).
6. Dedupe and sort: Use Set for uniqueness, then sort as specified.
7. Return { outputlist1: [...], outputlist2: [...] }.

## Bubble Script Usage
```
const dataInput = JSON.parse(data);
const result = getBlockedDates(dataInput);
return result;
```
