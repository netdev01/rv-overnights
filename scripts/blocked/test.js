// Test script for blocked dates frontend function

const { getBlockedDates } = require('./blocked-frontend');

// Test cases
const testCases = [
  // Test Case 1: No selectSpace - any space mode
  {
    name: "No selectSpace - any space mode",
    input: {
      "spaces": [1, 2],
      "blocked": [
        {"yearly": false, "space": [], "start date": "12/01/2025", "end date": "12/05/2025"},
        {"yearly": false, "space": [], "start date": "12/21/2025", "end date": "12/23/2025"},
        {"yearly": true, "space": [1], "start date": "11/20/2025", "end date": "11/21/2025"},
        {"yearly": true, "space": [1], "start date": "12/10/2025", "end date": "12/11/2025"}
      ]
    },
    expected: {
      datesYearly: ["11/20", "11/21", "12/10", "12/11"],
      datesNotYearly: ["12/01/25","12/02/25","12/03/25","12/04/25","12/05/25","12/21/25","12/22/25","12/23/25"]
    }
  },
  // Test Case 2: selectSpace: 1
  {
    name: "selectSpace: 1",
    input: {
      "spaces": [1, 2],
      "selectSpace": 1,
      "blocked": [
        {"yearly": false, "space": [], "start date": "12/01/2025", "end date": "12/05/2025"},
        {"yearly": false, "space": [], "start date": "12/21/2025", "end date": "12/23/2025"},
        {"yearly": true, "space": [1], "start date": "11/20/2025", "end date": "11/21/2025"},
        {"yearly": true, "space": [1], "start date": "12/10/2025", "end date": "12/11/2025"}
      ]
    },
    expected: {
      datesYearly: ["11/20", "11/21", "12/10", "12/11"],
      datesNotYearly: ["12/01/25","12/02/25","12/03/25","12/04/25","12/05/25","12/21/25","12/22/25","12/23/25"]
    }
  },
  // Test Case 3: selectSpace: 2 - no yearly blocks for space 2
  {
    name: "selectSpace: 2 - no yearly blocks for space 2",
    input: {
      "spaces": [1, 2],
      "selectSpace": 2,
      "blocked": [
        {"yearly": false, "space": [], "start date": "12/01/2025", "end date": "12/05/2025"},
        {"yearly": false, "space": [], "start date": "12/21/2025", "end date": "12/23/2025"},
        {"yearly": true, "space": [1], "start date": "11/20/2025", "end date": "11/21/2025"},
        {"yearly": true, "space": [1], "start date": "12/10/2025", "end date": "12/11/2025"}
      ]
    },
    expected: {
      datesYearly: [],
      datesNotYearly: ["12/01/25","12/02/25","12/03/25","12/04/25","12/05/25","12/21/25","12/22/25","12/23/25"]
    }
  }
];

// Test runner function
function runTests() {
  console.log('='.repeat(80));
  console.log('BLOCKED DATES TEST SUITE');
  console.log('='.repeat(80));
  console.log('');

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    console.log(`Test Case ${index + 1}: ${testCase.name}`);
    console.log('-'.repeat(60));

    const result = getBlockedDates(testCase.input);

    console.log(`Expected: ${JSON.stringify(testCase.expected)}`);
    console.log(`Actual:   ${JSON.stringify(result)}`);

    if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL');
      failed++;
    }

    console.log('');
  });

  // Summary
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
  }

  return { passed, failed, total: testCases.length };
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testCases, runTests };
