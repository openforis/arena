#! /usr/bin/env bash
echo "Travis pull_request job"
cd "$(dirname "$0")" || exit 1

# Download dependencies and build
yarn install --frozen-lockfile

# Preview changes that would be made if the PR were merged.
case ${TRAVIS_BRANCH} in
    master)
        pulumi stack select arena-test
        pulumi preview
        ;;
    production)
        pulumi stack select arena-production
        pulumi preview
        ;;
    *)
        echo "No Pulumi stack targeted by pull request branch ${TRAVIS_BRANCH}."
        ;;
esac
