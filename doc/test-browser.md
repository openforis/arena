# UI tests

UI tests should be defined under `/test/browser` folder.

## How to define a test case

- Create a `.spec` file under the `specs` folder, giving it a numbered prefix following the order of execution (e.g. `123-my-new-specification.spec`)
- Give it a title (e.g. `# My new specification`)
- Describe the objective of the test scenario
- Define each step (e.g. `## First step`)
- Assign `Tags` to each step to facilitate steps grouping and search
- Create a `.js` file under the `tests` folder, with the same name as the `.spec` file
  - Put in this file step implementations specific to the relative test scenario
  - Put common step implementations under tests/common folder
