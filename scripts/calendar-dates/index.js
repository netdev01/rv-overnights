function getDaysInMonth(month, year) {
    // Convert month to 0-based index and parse year
    const jsMonth = parseInt(month);
    const jsYear = parseInt(year);
    
    const days = [];
    const timezone = 'America/Menominee';
    
    // Helper function to create a date with timezone adjustment
    function createDateInTimezone(year, month, day) {
        // Create date at noon to avoid DST transition issues
        const date = new Date(year, month, day, 12, 0, 0);
        
        // Add timezone information to the date object
        date.timezone = timezone;
        
        // Add method to format the date in the correct timezone
        date.formatInTimezone = function(options = {}) {
            return new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                ...options
            }).format(this);
        };
        
        return date;
    }
    
    // Create date for the first of the month in specified timezone
    const firstDayOfMonth = createDateInTimezone(jsYear, jsMonth, 1);
    
    // Get day of week for the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // No adjustment needed as Sunday is already 0 in JavaScript's Date.getDay()
    const firstDayWeekDay = firstDayOfMonth.getDay();
    
    // Get the last day of previous month
    const lastDayPrevMonth = new Date(jsYear, jsMonth, 0).getDate();
    
    // Fill in days from previous month
    for (let i = 0; i < firstDayWeekDay; i++) {
        const prevMonthDay = lastDayPrevMonth - firstDayWeekDay + i + 1;
        days.push(createDateInTimezone(jsYear, jsMonth - 1, prevMonthDay));
    }
    
    // Fill in days of current month
    const lastDayOfMonth = new Date(jsYear, jsMonth + 1, 0).getDate();
    for (let i = 1; i <= lastDayOfMonth; i++) {
        days.push(createDateInTimezone(jsYear, jsMonth, i));
    }
    
    // Calculate remaining days needed to fill 42 spots
    const remainingDays = 42 - days.length;
    
    // Fill in days from next month
    for (let i = 1; i <= remainingDays; i++) {
        days.push(createDateInTimezone(jsYear, jsMonth + 1, i));
    }
    
    return days;
}
