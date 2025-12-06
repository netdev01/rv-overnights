README — Additional Nights Available (Frontend)

Purpose
-------
This README explains the frontend test harness for the "additional nights available" logic used by the RV-overnights project. The frontend code lives in frontend.js and the test runner is test-frontend.js. The tests exercise booking validation rules (availability, blocked dates, same-day rules, days-in-advance, conflicts, and formatting of invalid blocked-date entries).

Files
-----
- frontend.js  — The frontend function checkAdditionalNightsAvailable(input) exported for testing.
- test-frontend.js — A standalone Node.js script that runs a suite of deterministic test cases against frontend.js and prints a human-readable summary.
- test.json / test-basic.js / test-extended.js — auxiliary test data and variants for extended checks.

Prerequisites
-------------
- Node.js (tested with Node 16+; use nvm if you need to switch versions)

How to run the frontend tests
-----------------------------
From the repository root run:

  node scripts/additional-nights-available/test-frontend.js

You should see an ASCII test summary with each test case, expected vs actual results, and a final summary. Example output ends with "All tests passed!" when everything succeeds.

Common issues and troubleshooting
--------------------------------
- SyntaxError: Unexpected token '<' when running the test script
  - Cause: historically some editors/ops accidentally appended non-JS content (HTML/XML footer) to test-frontend.js. If you see this error inspect the end of the file and remove any non-JS footer.

- Mismatched errorMessage for invalid blocked entries
  - The frontend normalizes invalid blocked entries into a deterministic JSON array string (JSON.stringify on the collected invalid entries). If you update frontend.js or the test expectations, ensure the expected errorMessage in test-frontend.js exactly matches the JSON output produced by the function.

Development notes
-----------------
- The frontend intentionally treats invalid blocked-date entries as "ignored" and reports them in the errorMessage. This helps detect malformed input while preserving availability behavior.
- If you make functional changes to how invalid blocked entries are represented, update the test expectations in test-frontend.js accordingly.

How to add or update tests
--------------------------
- Edit test-frontend.js and modify or add new test cases in the testCases array. Each test case must include:
  - name: descriptive test name
  - input: either a JSON string or an object that will be stringified
  - expected: the expected result object { status, message, errorMessage }

After editing, run the test script again to verify.

Contact / Next steps
--------------------
If you need help adjusting the frontend behavior or aligning test expectations, open an issue or ask the maintainer. The frontend tests are intentionally small and deterministic to make local iteration fast.
