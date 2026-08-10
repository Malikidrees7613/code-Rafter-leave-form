const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

const parseDate = (value) => {
    const date = value instanceof Date ? new Date(value) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());


const calculateDays = (startDate, endDate) => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!start || !end) return 0;

    const startDay = startOfDay(start);
    const endDay = startOfDay(end);
    if (endDay < startDay) return 0;

    return Math.round((endDay - startDay) / MILLIS_PER_DAY) + 1;
};

const countWorkingDays = (startDate, endDate) => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!start || !end) return 0;

    const startDay = startOfDay(start);
    const endDay = startOfDay(end);
    if (endDay < startDay) return 0;

    let count = 0;
    const current = new Date(startDay);
    while (current <= endDay) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) count += 1;
        current.setDate(current.getDate() + 1);
    }
    return count;
};

module.exports = { calculateDays, countWorkingDays };
