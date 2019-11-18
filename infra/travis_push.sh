#! /usr/bin/env bash
echo "Travis push job"
cd "$(dirname "$0")" || exit 1

# Download dependencies and build
yarn install --frozen-lockfile

# Require an annotated tag for automatic deploy to the QA/testing environment:
commit_tag=$(git describe --exact-match HEAD 2>/dev/null)

# Update the stack
case ${TRAVIS_BRANCH} in
    master)
        if [[ -n $commit_tag ]]; then
            echo "Deploying tagged release to QA environment: $commit_tag"
            pulumi stack select arena-test
            pulumi up --yes
        else
            echo "Skipping deploy for an untagged commit"
        fi
        ;;
    production)
        pulumi stack select arena-production
        pulumi up --yes
        ;;
    *)
        echo "No Pulumi stack associated with branch ${TRAVIS_BRANCH}."
        ;;
esac
