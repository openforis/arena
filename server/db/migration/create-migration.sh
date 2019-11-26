#! /usr/bin/env bash
set -e

if [[ -z $1 ]]
  then
    echo "Give the name of the migration as parameter"
    exit 2
fi

type=${2:-public}

. .env

db-migrate \
  --config server/db/migration/migrationConfig.js \
  --migrations-dir server/db/migration/"$type"/migrations \
  create "$1" --sql-file
