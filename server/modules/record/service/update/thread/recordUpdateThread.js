// NB: This file must end with ".js"
// This is a worker-threads limitation!
// TODO: This is pretty slow. Pre-compile TS->JS for production at least.
const path = require('path');

require('ts-node').register({
    fast: true,
    // Node does not yet understand ES6 modules:
    compilerOptions: { module: "commonjs" },
});
require(path.resolve(__dirname, 'recordUpdateThread.ts'));
