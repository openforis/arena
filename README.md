# OpenForis Arena - The cloud platform from OpenForis

## Prerequisites

First, [install Yarn](https://yarnpkg.com/en/docs/install) (a modern npm replacement).

Then, install [Node.js](https://nodejs.org/en/download/) (currently we are using LTS version 12.x).

## Development (server and the web app)

Installing dependencies:
```shell
yarn
npm rebuild node-sass # Sometimes needed
```

For development, `yarn watch` will run the server and the Web app in parallel and "hot reload" on any changes:
```shell
yarn watch
```

## The .env file

The .env file is needed for development and locally running the stack.

must be added to the root directory of the project and must match the template `.env.template`.

## Running the stack locally

The following runs the "production" stack locally with Docker Compose, (re-)buildigs.
This creates a web server listening on `localhost` port `9880` by default.

Note that the Dockerfile build process will only use the `HEAD` commit from the currently
checked out branch. Uncommitted changes will be ignored.

```shell
docker-compose up --build --abort-on-container-exit
```

## Running the test suite

The following runs the test suite with an isolated Dockerized DB instance.

Note: What's tested is the **committed** code only. Uncommitted changes are ignored.

```shell
yarn test:docker
```

## Database migrations

Migrations are run automatically on server startup.

### Adding a new database migration

When you need execute DDL or other update update logic (e.g. to add a new table to the database, `dbtable`), create a migration template with:

```shell
yarn run create-migration add-table-dbtable
```

Now you'll see new sql files in `db/migration/migrations/sql/<timestamp>- add-table-dbtable-<up/down>.sql`

You should edit the `<timestamp>-add-table-dbtable-up.sql` to contain your DDL statements.

You could also add the corresponding `drop table` to `<timestamp>-add-table-dbtable-down.sql` if you ever want to undo migrations.
