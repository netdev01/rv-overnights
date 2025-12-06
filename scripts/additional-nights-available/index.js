// index.js — compatibility wrapper for backend tests
const backend = require('./backend');

module.exports = {
  checkAdditionalNightsAvailable: backend.checkAdditionalNightsAvailable,
  isValidDateString: backend.isValidDateString,
  generateDateRange: backend.generateDateRange,
};
