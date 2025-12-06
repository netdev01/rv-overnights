# getDaysInMonth Function

A JavaScript function that generates an array of Date objects representing a complete 6-week calendar grid for a given month and year, including leading days from the previous month and trailing days from the next month.

## Function Signature

```javascript
getDaysInMonth(month, year)
```

### Parameters

- `month` (string|number): The month to generate dates for. Expected to be 0-based (0 = January, 1 = February, ..., 11 = December). Note: This differs from common human-readable month numbering (1-12).
- `year` (string|number): The year to generate dates for (e.g., 2024, 2025).

### Return Value

Returns an array of 42 Date objects representing a complete 6-week calendar grid (6 rows × 7 columns = 42 days). Each Date object is enhanced with additional properties:

- `timezone` (string): Set to `'America/Menominee'`
- `formatInTimezone(options)` (function): A method that formats the date using `Intl.DateTimeFormat` with the specified timezone

The array includes:
- Leading days from the previous month to fill the first week starting on Sunday
- All days of the requested month
- Trailing days from the next month to complete the 42-day grid

## Usage Example

```javascript
const calendarDays = getDaysInMonth(11, 2024); // December 2024

console.log(calendarDays.length); // 42

// Format the first day in the timezone
console.log(calendarDays[0].formatInTimezone()); // "11/24/2024"

// Check if a day is from the current month (you may need to track this separately)
const targetMonth = 11; // December
const isCurrentMonth = (date) => date.getMonth() === targetMonth;
```

## Implementation Details

- Dates are created at noon (12:00) to avoid Daylight Saving Time transition issues
- The function assumes months are 0-based (JavaScript Date convention)
- Uses standard JavaScript Date objects with timezone metadata for formatting
- Always returns exactly 42 dates to fill a standard calendar grid

## Important Notes

### Month Parameter Caveat
The function expects 0-based month indexing:
- `0` = January
- `1` = February
- ...
- `11` = December

If you have 1-based month numbers (common in user interfaces), you must convert them:

```javascript
// Correct usage for December
const december = getDaysInMonth(11, 2024);

// Incorrect usage (will return January 2025)
const wrongDecember = getDaysInMonth(12, 2024);
```

### Timezone Handling
The Date objects are created in the local timezone but include formatting helpers for the 'America/Menominee' timezone. The actual Date timestamps are not timezone-adjusted - only the formatting methods use the specified timezone.

For applications requiring precise timezone-aware date calculations, consider using libraries like Luxon or the Temporal API.

## Dependencies

None. Uses only built-in JavaScript APIs:
- `Date`
- `Intl.DateTimeFormat`
- `parseInt`

## Potential Improvements

1. **Month validation**: Add input validation to ensure month is 0-11
2. **Enhanced return objects**: Return objects with `{ date, isCurrentMonth }` structure
3. **Timezone flexibility**: Allow timezone to be passed as a parameter
4. **Explicit radix**: Use `parseInt(value, 10)` for safer parsing

## Related Files

- `index.js`: Contains the `getDaysInMonth` function implementation
