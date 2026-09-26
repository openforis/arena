# NB: This is a subset of the main Dockerfile in attempt
# to make this work faster when there have been changes.
############################################################

FROM node:24.11.1 AS test

# Install git and netcat, PM2 and cross-env
RUN apt-get update; \
    apt-get install -y git netcat-openbsd; \
    apt-get autoremove; apt-get autoclean; \
    npm install pm2 cross-env -g

WORKDIR /app

# Cache these as much as possible:
COPY package.json yarn.lock /app/

# Install the dependencies and the browser used by the e2e tests (Playwright Test, version pinned by the lockfile)
RUN yarn install --ignore-scripts --frozen-lockfile; \
    yarn playwright install --with-deps chromium

COPY .git /app/.git
RUN git reset --hard; yarn build:server:dev

############################################################
