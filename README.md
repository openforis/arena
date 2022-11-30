# Open Foris Arena
Online platform for survey design, data management, utilization and processing.

Arena is a cloud-based platform for storing and processing data collected in field inventories or questionnaires. It provides a fast and flexible way to set up a survey and start entering data for a team. It offers tools for data quality assurance with the help of data validation and reporting methods. Arena also offers multilingual data entry forms, multi-cycle data management, and computing of new result attributes and running statistical analysis with integrated connection to RStudio Server or local installation of RStudio.

Arena also offers a map with access to very-high resolution satellite images. The Arena Map can be used, for example, for verifying locations of collected data, and for conducting sample-based image interpretation.

## Installation

### Prerequisites

- [download and install Docker](https://www.docker.com/). Docker is an open platform for developing, shipping, and running applications.
- Install a local database (PostgreSQL) as a Docker container. Run this command from command line; it will create also a database named 'arena' and a user 'arena' with password 'arena' and will make the DBMS listen on port 5444 (you can change those parameters as you wish):
```shell script
sudo docker run -d --name arena-db -p 5444:5432 -e POSTGRES_DB=arena -e POSTGRES_PASSWORD=arena -e POSTGRES_USER=arena postgis/postgis:12-3.0
```
You can also use an already existing PostgreSQL database installed in a different way and configure Arena to connect to it.

### Prepare a file with the parameters to pass to Arena

The file (call it arena.env) must be a text file with this content:

```shell script
# Default web server port
ARENA_PORT=9090

# DB
## specify the connection parameters as a URL in the format
## postgres://user:password@host:port/database
# DATABASE_URL=postgres://arena:arena@localhost:5444/arena
## or one by one
PGHOST=localhost
PGPORT=5444
PGDATABASE=arena
PGUSER=arena
PGPASSWORD=arena

# temporary uploaded files folder
TEMP_FOLDER=/home/your_user/openforis/arena/upload

# Email service (Arena uses Sendgrid to send emails)
SENDGRID_API_KEY= # get it from https://sendgrid.com/

# Analysis
ANALYSIS_OUTPUT_DIR=/home/your_user/openforis/arena/analysis

# Server
## HTTP Session
## Secret used to sign the session ID cookie 
SESSION_ID_COOKIE_SECRET=my-cookie-secret-key

## Set to true if http requests must be forwarded to https
USE_HTTPS=false

# RStudio Server
RSTUDIO_DOWNLOAD_SERVER_URL=
RSTUDIO_SERVER_URL=
RSTUDIO_PROXY_SERVER_URL=
RSTUDIO_POOL_SERVER_URL=
RSTUDIO_POOL_SERVICE_KEY=

# reCAPTCHA v2 keys (get it from https://www.google.com/recaptcha/about/)
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

# MAP
## Planet Lab Maps API key (get it from https://www.planet.com/markets/mapping/)
MAP_API_KEY_PLANET=

# System Admin user email address
# used to create default system admin user when DB is empty
# and to send emails to the users
ADMIN_EMAIL=
# Admin user password: used only when default system admin user is created the first time
# it MUST BE DELETED after the first startup
ADMIN_PASSWORD=

```

### Install and run Arena

Arena will be installed as a Docker container.
Run this command from command line:
```shell script
sudo docker run --env-file ./arena.env openforis/arena:latest
```
You can run this command in the same folder where you have defined the arena.env file or specify its path in the command, in the '--env-file' parameter.
Arena will start on the port specified in the arena.env file (9090 by default).
You can use the same command to start up Arena again once you stop it.

## Open Arena in the browser

Once you started Arena with the previous command, you can open this address in your browser:
http://localhost:9090

If the installation process was successful, the Arena login form should appear.

When Arena starts up the first time, a system admnistrator user is created using the parameters ADMIN_EMAIL and ADMIN_PASSWORD specified in the arena.env file, so you can use that email address and password to access Arena the first time. The password can be changed using the **Change password** function in Arena.

## Run R Studio Server locally

To install RStudio Server as a Docker container run the following command:

- replace ANALYSIS_OUTPUT_DIR with the value of the ANALYSIS_OUTPUT_DIR environment variable

```shell script
docker run -d --name arena-rstudio --network=host -v ANALYSIS_OUTPUT_DIR:/home/rstudio -e DISABLE_AUTH=true rocker/rstudio
```

To restart RStudio server run

```shell script
docker container restart arena-rstudio
```

Visit http://localhost:8787 in your browser to access the rStudio server instance.

# Documentation

You can find the Arena documentation in the [Open Foris website](https://openforis.org/tools/arena/).

### License

Arena is [MIT licensed](./LICENSE).