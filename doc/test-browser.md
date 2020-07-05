# Browser tests

Browser tests have been implemented using [taiko](https://taiko.dev) and [gauge](https://gauge.org/).  
Make sure you have them installed before running tests.

## Install Gauge

Gauge can be installed quickly in this way:

- Install using NPM

  - `npm install -g @getgauge/cli`

- Install on Mac OS:
  - `brew install gauge`

See documentation for more information.

## Run Gauge

`gauge run -d test/browser/`

## How to define a test scenario

Browser tests must be defined under `/test/browser` folder.

- Create a `.spec` file under the `specs` folder, giving it a numbered prefix following the order of execution (e.g. `123-my-new-specification.spec`)
- Give it a title (e.g. `# My new specification`)
- Describe the objective of the test scenario
- Define each step (e.g. `## First step`)
- Assign `Tags` to each step to facilitate steps grouping and search
- Create a `.js` file under the `tests` folder, with the same name as the `.spec` file
  - Put in this file step implementations specific to the relative test scenario
  - Put common step implementations under tests/common folder
