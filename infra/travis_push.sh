#! /usr/bin/env bash
set -e # fail early

echo "Travis push job"
cd "$(dirname "$0")" || exit 1

# Download dependencies and build
yarn install --frozen-lockfile

# Require an annotated tag for automatic deploy to the QA/testing environment:
commit_tag=$(git describe --exact-match HEAD 2>/dev/null || true)

# Workaround for long ECS deploy durations causing timeouts
# Revisit when there's progress with https://github.com/pulumi/pulumi/issues/3529
pulumi_up() {
    pulumi up --yes || pulumi up --yes
}

# Update the stack
case ${TRAVIS_BRANCH} in
    master)
        pulumi stack select arena-dev
        pulumi_up
        if [[ -n $commit_tag ]]; then
            echo "Deploying tagged release to QA environment: $commit_tag"
            pulumi stack select arena-test
            pulumi_up
        fi
        ;;
    production)
        pulumi stack select arena-production
        pulumi_up
        ;;
    *)
        echo "No Pulumi stack associated with branch ${TRAVIS_BRANCH}."
        ;;
esac
