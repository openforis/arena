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

# Set RStudio Server working directory and install required RStudio Server libraries, NGINX and curl
RUN mkdir -p /home/rstudio/chains \
    && echo 'setwd("/home/rstudio/chains")' >> /usr/local/lib/R/etc/Rprofile.site \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl git libpq-dev nginx xz-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
COPY --from=base /app/infra/nginx/nginx.conf /etc/nginx/sites-available/default
COPY --from=base /app/infra/nginx/rstudio_pass /etc/nginx/rstudio_pass

# Build Arena (Node.js official binaries, verified with their checksum)
ARG legacy_node_version=14.21.3
ARG legacy_node_sha256=05c08a107c50572ab39ce9e8663a2a2d696b5d262d5bd6f98d84b997ce932d9a
RUN curl --proto '=https' --tlsv1.2 -fsSLo /tmp/node.tar.xz \
      "https://nodejs.org/dist/v${legacy_node_version}/node-v${legacy_node_version}-linux-x64.tar.xz" \
    && echo "${legacy_node_sha256}  /tmp/node.tar.xz" | sha256sum -c - \
    && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.xz \
    && npm install -g --ignore-scripts pm2@5.3.1
COPY --from=base /app /app
WORKDIR /app
RUN npm run build:server:prod \
    && npm run build-prod \
    && ln -s dist/server.js .

# Start
COPY --from=base /app/infra/web/start.sh /app/start.sh
RUN chmod +x start.sh
CMD ["./start.sh"]

#############################################################