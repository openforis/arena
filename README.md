# OpenForis Arena - The cloud platform from OpenForis

## Prerequisites

First, [install Yarn](https://yarnpkg.com/en/docs/install) (a modern npm replacement).

Then, install [Node.js](https://nodejs.org/en/download/) (currently we are using LTS version 12.x).

## Development

To install local database:
```shell script
sudo docker run -d --name arena-db -p 5444:5432 -e POSTGRES_DB=arena -e POSTGRES_PASSWORD=arena -e POSTGRES_USER=arena postgis/postgis:12-3.0
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
docker run -d --name arena-rstudio --add-host="localhost:YOUR_IP" -p 127.0.0.1:8787:8787 -v ANALYSIS_OUTPUT_DIR:/home/rstudio -e DISABLE_AUTH=true rocker/rstudio
```

To restart RStudio server run
```shell script
docker container restart arena-rstudio
```

Visit http://localhost:8787 in your browser to access the rStudio server instance.
