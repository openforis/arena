# NB: This is a subset of the main Dockerfile in attempt
# to make this work faster when there have been changes.
############################################################

FROM node:12-alpine AS test

RUN apk add --no-cache git

# Cache these as much as possible:
COPY package.json yarn.lock /app/

RUN cd /app; yarn install --ignore-scripts --frozen-lockfile; npm rebuild node-sass

COPY .git /app/.git
RUN cd /app; git reset --hard; yarn build:server:dev

WORKDIR /app

############################################################
