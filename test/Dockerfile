# NB: This is a subset of the main Dockerfile in attempt
# to make this work faster when there have been changes.
############################################################

FROM node:12.16.0 AS test

# add Gauge key
RUN apt-key adv --no-tty --keyserver hkp://keyserver.ubuntu.com --recv-keys 023EDB0B
RUN echo deb http://dl.bintray.com/gauge/gauge-deb stable main | tee -a /etc/apt/sources.list

RUN apt-get update
RUN apt-get install -y git netcat gauge
RUN apt-get autoremove; apt-get autoclean

# Cache these as much as possible:
COPY package.json yarn.lock /app/

# install Taiko
RUN npm install -g taiko --unsafe-perm --allow-rootCopy

RUN cd /app; yarn install --ignore-scripts --frozen-lockfile; npm rebuild node-sass

COPY .git /app/.git
RUN cd /app; git reset --hard; yarn build:server:dev

WORKDIR /app

############################################################