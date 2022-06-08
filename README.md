# OpenForis Arena - The cloud platform from OpenForis

## Prerequisites

First, [install Yarn](https://yarnpkg.com/en/docs/install) (a modern npm replacement).

Then, install [Node.js](https://nodejs.org/en/download/) (currently we are using LTS version 14.x).

### GitHub packages: authentication

Arena requires some GitHub packages (@openforis/arena-core and @openforis/arena-server).
In order to do that, you must use a token with (at least) the `read:packages` scope.

You can authenticate to GitHub Packages with npm by either editing your per-user ~/.npmrc file to include your personal access token or by logging in to npm on the command line using your username and personal access token.

To authenticate by adding your personal access token to your ~/.npmrc file, edit the ~/.npmrc file for your project to include the following line, replacing TOKEN with your personal access token. Create a new ~/.npmrc file if one doesn't exist and replace TOKEN with your personal access token.

```shell
//npm.pkg.github.com/:_authToken=TOKEN
```

To authenticate by logging in to npm, use the npm login command, replacing USERNAME with your GitHub username, TOKEN with your personal access token, and PUBLIC-EMAIL-ADDRESS with your email address.

If GitHub Packages is not your default package registry for using npm and you want to use the npm audit command, we recommend you use the --scope flag with the owner of the package when you authenticate to GitHub Packages.

```shell
$ npm login --scope=@OWNER --registry=https://npm.pkg.github.com

> Username: USERNAME
> Password: TOKEN
> Email: PUBLIC-EMAIL-ADDRESS
```

> For more information see [Authenticating to GitHub Packages](https://docs.github.com/en/packages/guides/configuring-npm-for-use-with-github-packages#authenticating-to-github-packages)

## Development

To install local database:

```shell script
sudo docker run -d --name arena-db -p 5444:5432 -e POSTGRES_DB=arena -e POSTGRES_PASSWORD=arena -e POSTGRES_USER=arena postgis/postgis:12-3.0
```

In order to access Arena when it's installed on a remote server, you need to request access to it or being invited to it.
To simplify this process when working locally, you can insert a test user with System Administrator rights (username: test@openforis-arena.org - password: test) directly into the database running this SQL script with the SQL client you prefer:

```
INSERT INTO "user" (name, email, PASSWORD, status)
VALUES ('Tester', 'test@openforis-arena.org', '$2a$10$6y2oUZVrQ7aXed.47h4sHeJA8VVA2dW9ObtO/XLveXSzQKBvTOyou', 'ACCEPTED');

INSERT INTO auth_group_user (user_uuid, group_uuid)
SELECT u.uuid, g.uuid
FROM "user" u
    JOIN auth_group g ON u.email = 'test@openforis-arena.org' AND g.name = 'systemAdmin';
```

To restart local database:

```shell script
docker container restart arena-db
```

To install dependencies:

```shell
yarn
npm rebuild node-sass # Sometimes needed
```

To run the server and the Web app in parallel with "hot reload" on any changes:

```shell
yarn watch
```

## The .env file

The .env file is needed for development and locally running the stack.

must be added to the root directory of the project and must match the template `.env.template`.

## Running the test suite

The following runs the test suite with an isolated Dockerized DB instance.

Note: What's tested is the **committed** code only. Uncommitted changes are ignored.

```shell
yarn test:docker
```

## Run R Studio Server locally

To install RStudio Server as a Docker container run the following command:

- replace ANALYSIS_OUTPUT_DIR with the value of the ANALYSIS_OUTPUT_DIR environment variable
- replace YOUR_IP with your machine ip address

```shell script
docker run -d --name arena-rstudio --add-host="localhost:YOUR_IP" -p 8787:8787 -v ANALYSIS_OUTPUT_DIR:/home/rstudio -e DISABLE_AUTH=true rocker/rstudio
```

To restart RStudio server run

```shell script
docker container restart arena-rstudio
```

Visit http://localhost:8787 in your browser to access the rStudio server instance.
