# OpenForis Arena - The cloud platform from OpenForis

## Prerequisites

First, [install Yarn](https://yarnpkg.com/en/docs/install) (modern npm replacement).

Then, install [NodeJs](https://nodejs.org/en/download/) (currently the LTS version we are using is 6.x).

## Building web application

To build it once:

```yarn run build```

To constantly build it when something changes, run:

```yarn watch```

## Running the server

```node server/server.js```



## Database

#### Create your own local datbase

If you have a Docker server configured locally, just run this command:


```sudo docker run -d --name of-arena-dev-db -p 5444:5432 -e POSTGRES_DB=of-arena-dev -e POSTGRES_PASSWORD=arena -e POSTGRES_USER=arena mdillon/postgis:11```

Add the db configurations to the **`.env`** file [(see .env section)](#env-file)

#### To restart the database server

```docker container restart of-arena-dev-db```

#### Database Migrations

Migrations are run automatically on startup of the server.

##### Adding a database migration

When you need execute a DDL (e.g. add new table to the database, say "dbtable"), create a migration template with:

```yarn run create-migration add-table-dbtable```

Now you'll see new sql files in `db/migration/migrations/sql/<timestamp>-kuikka-<up/down>.sql`

You should edit the `<timestamp>-add-table-dbtable-up.sql to contain your `create table` -statement. 
You could also add the corresponding `drop table` to `<timestamp>-add-table-dbtable-down.sql` if you ever want to run migrations downwards.


## .env File

The .env file must be added to the root directory of the project and must contain the following environment variables:
```
# Default web server port
PORT=9090

# DB
PGHOST=localhost
PGPORT=5444
PGDATABASE=of-arena-dev
PGUSER=arena
PGPASSWORD=arena

# Session
FOO_COOKIE_SECRET=my-cookie-secret-key
```

## Predefined users

##### ***ADMIN USER***: 
email:admin@openforis.org 

pwd:admin 


## Setup eslint on IntelliJ IDEA

### Enable ESLint

Open the *Settings/Preferences* dialog and choose *JavaScript* under *Languages and Frameworks*. Choose *ESLint* under *Code Quality Tool*. Select the *Enable* Checkbox.

Make sure that *Node Interpreter* points to the right Node.js path.

Make sure that the *ESLint Package* field points to the right ESLint package (it should be *.../arena/node_modules/eslint*).

Under *Configuration File* choose *Automatic search*.

### Import code style from ESLint

Open the `.eslintrc.json` file and answer yes to the question "Apply code style from ESLint?" question on top of the file.
