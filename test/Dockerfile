# NB: This is a subset of the main Dockerfile in attempt
# to make this work faster when there have been changes.
############################################################

FROM node:24.11.1 AS test

# Install git, netcat and PM2 (cross-env is a project dependency)
RUN apt-get update; \
    apt-get install -y git netcat-openbsd; \
    apt-get autoremove; apt-get autoclean; \
    npm install -g --ignore-scripts pm2@7.0.4

WORKDIR /app

# Cache these as much as possible:
COPY package.json yarn.lock /app/

# Install the dependencies and the browser used by the e2e tests (Playwright CLI version locked by yarn.lock)
RUN yarn install --ignore-scripts --frozen-lockfile; \
    ./node_modules/.bin/playwright install --with-deps chromium

COPY .git /app/.git
RUN git reset --hard; yarn build:server:dev

############################################################
