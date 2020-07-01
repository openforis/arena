#!/bin/bash

# exit on first failure
set -e
# print trace
set -x

printenv

mkdir -p $TEMP_FOLDER $ANALYSIS_OUTPUT_DIR;

# wait for postgres to startup
while ! nc -z $PGHOST $PGPORT; do sleep 1; done;

# Copy db migrations from test to server folder
cp test/db/migrations/*.js server/db/migration/public/migrations
cp test/db/migrations/sqls/*.sql server/db/migration/public/migrations/sqls

# Run unit and integration tests
yarn run npm-run-all server:migrate

# Build and start Arena
npm run build:server:prod; npm run build-prod;
ln -s dist/server.js .
exec pm2-runtime server.js &

# wait for Arena localhost port 9090 to be available
while ! nc -z localhost 9090; do sleep 10; done;

# gauge run -d test/browser/
yarn run test:e2e
