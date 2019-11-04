#! /bin/sh
set -Eeu

cleanup() {
    docker-compose -f test/docker-compose.test.yml rm -f
}
# Attempt to clean up on exit
trap cleanup EXIT

# Trigger a rebuild of docker files
docker-compose -f test/docker-compose.test.yml build &

# Remove any old images and containers if there were any.
# We want to test with a clean DB.
cleanup &

# Wait until background operations are ready.
wait

# Run commands until server_test is finished:
docker-compose -f test/docker-compose.test.yml up \
    --abort-on-container-exit \
    --exit-code-from arena_test
