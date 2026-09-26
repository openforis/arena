# NB: This is a subset of the main Dockerfile in attempt
# to make this work faster when there have been changes.
############################################################

FROM node:24.11.1 AS test

# Install git and netcat
RUN apt-get update; \
    apt-get install -y git netcat-openbsd; \
    apt-get autoremove; apt-get autoclean;

# Install PM2
RUN npm install pm2 -g
# Install cross-env
RUN npm install cross-env -g

# Cache these as much as possible:
COPY package.json yarn.lock /app/

RUN cd /app; yarn install --ignore-scripts --frozen-lockfile;
# Install the browser used by the e2e tests (Playwright Test), with its system dependencies
RUN cd /app; npx playwright install --with-deps chromium

COPY .git /app/.git
RUN cd /app; git reset --hard; yarn build:server:dev

WORKDIR /app

############################################################