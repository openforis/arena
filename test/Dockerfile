# NB: This is a subset of the main Dockerfile in attempt
# to make this work faster when there have been changes.
############################################################

FROM node:12.16.0 AS test

RUN apt update
RUN apt install -y git netcat

# Cache these as much as possible:
COPY package.json yarn.lock /app/

RUN cd /app; yarn install --ignore-scripts --frozen-lockfile; npm rebuild node-sass

#Install gauge
RUN apt-key adv --no-tty --keyserver hkp://keyserver.ubuntu.com --recv-keys 023EDB0B
RUN echo deb http://dl.bintray.com/gauge/gauge-deb stable main | tee -a /etc/apt/sources.list
RUN apt update
RUN apt install -y gauge

COPY .git /app/.git
RUN cd /app; git reset --hard; yarn build:server:dev

WORKDIR /app

############################################################