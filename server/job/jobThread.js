// NB: This file must end with ".js"
// This is a worker-threads limitation!
const path = require('path');

require('ts-node').register({
    fast: true,
    // Node does not yet understand ES6 modules:
    compilerOptions: { module: "commonjs" },
});
require(path.resolve(__dirname, 'jobThread.ts'));
