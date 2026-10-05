############################################################

ARG node_version=24.11.1

FROM node:${node_version} AS base
RUN apt-get update \
    && apt-get install -y git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache these as much as possible:
COPY package.json yarn.lock /app/

RUN yarn install --ignore-scripts --frozen-lockfile

COPY .git /app/.git
RUN git reset --hard

############################################################

FROM rocker/rstudio:3.6.1 AS arena-web

# Set RStudio Server working directory
RUN mkdir -p /home/rstudio/chains \
    && echo 'setwd("/home/rstudio/chains")' >> /usr/local/lib/R/etc/Rprofile.site

# Install required RStudio Server libraries, NGINX and curl
RUN apt-get update \
    && apt-get install -y libpq-dev nginx curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
COPY --from=base /app/infra/nginx/nginx.conf /etc/nginx/sites-available/default
COPY --from=base /app/infra/nginx/rstudio_pass /etc/nginx/rstudio_pass

# Build Arena (the NodeSource setup script updates the apt package lists)
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - \
    && apt-get install -y nodejs git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && npm install pm2 -g
COPY --from=base /app /app
WORKDIR /app
RUN npm run build:server:prod && npm run build-prod

# Start
RUN ln -s dist/server.js .
COPY --from=base /app/infra/web/start.sh /app/start.sh
RUN chmod +x start.sh
CMD ["./start.sh"]

#############################################################