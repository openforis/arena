# NB: This is a subset of the main Dockerfile in attempt
# to make this work faster when there have been changes.
############################################################

FROM node:18.12.1 AS test

# Install Chromium dependencies, git and netcat
RUN apt-get update; \
    apt-get install -y wget unzip fontconfig \
    locales gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
    libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
    libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
    fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils \
    git netcat; \
    apt-get autoremove; apt-get autoclean;

# Install Chromium
RUN npm install -g chromium --unsafe-perm
# Install PM2
RUN npm install pm2 -g
# Install cross-env
RUN npm install cross-env -g

# Cache these as much as possible:
COPY package.json yarn.lock /app/

RUN cd /app; yarn install --ignore-scripts --frozen-lockfile; npm rebuild node-sass --unsafe-perm

COPY .git /app/.git
RUN cd /app; git reset --hard; yarn build:server:dev

WORKDIR /app

############################################################