#! /usr/bin/env bash
set -e # fail early

echo "Travis push job"
cd "$(dirname "$0")" || exit 1

# Download dependencies and build
yarn install --frozen-lockfile

# Require an annotated tag for automatic deploy to the QA/testing environment:
COMMIT_TAG=$(git describe --exact-match HEAD 2>/dev/null || true)
COMMIT_HASH=$(git rev-parse HEAD)

# Workaround for long ECS deploy durations causing timeouts
# Revisit when there's progress with https://github.com/pulumi/pulumi/issues/3529
pulumi_up() {
    pulumi up --yes || pulumi up --yes
}

REPOSITORY_BASE=407725983764.dkr.ecr.eu-west-1.amazonaws.com

push() {
    # shellcheck disable=SC2091
    $(aws ecr get-login --no-include-email --region eu-west-1)

    pushd ..
    for target in arena-server arena-web; do
        docker build --target="$target" --tag "$target" .
        docker tag "$target" "$REPOSITORY_BASE/$target:$COMMIT_HASH"
        docker push "$REPOSITORY_BASE/$target:$COMMIT_HASH"
        for stack in "$@"; do
            docker tag "$target" "$REPOSITORY_BASE/$target:$stack"
            docker push "$REPOSITORY_BASE/$target:$stack"
        done
    done
    popd

    for stack in "$@"; do
        pulumi stack select "$stack"
        pulumi_up
    done
}

# Update the stack
case ${TRAVIS_BRANCH} in
    master)
        if [[ -n $COMMIT_TAG ]]; then
            echo "Deploying tagged release to QA environment: $COMMIT_TAG"
            push arena-dev arena-test
        else
            push arena-dev
        fi
        ;;
    production)
        push arena-prod
        ;;
    *)
        echo "No Pulumi stack associated with branch ${TRAVIS_BRANCH}."
        ;;
esac
