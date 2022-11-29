############################################################

ARG node_version=18.12.1

FROM node:${node_version} AS base
RUN apt update
RUN apt install -y git

# Cache these as much as possible:
COPY package.json yarn.lock /app/

RUN cd /app; yarn install --ignore-scripts --frozen-lockfile; npm rebuild node-sass

COPY .git /app/.git
RUN cd /app; git reset --hard

############################################################

FROM rocker/rstudio:3.6.1 AS arena-web

# Set RStudio Server working directory
RUN mkdir -p /home/rstudio/chains
RUN echo 'setwd("/home/rstudio/chains")' >> /usr/local/lib/R/etc/Rprofile.site

# Install required RStudio Server libraries
RUN apt update
RUN apt install -y libpq-dev

# Install NGINX
RUN apt update
RUN apt install -y nginx
COPY --from=base /app/infra/nginx/nginx.conf /etc/nginx/sites-available/default
COPY --from=base /app/infra/nginx/rstudio_pass /etc/nginx/rstudio_pass

# Build Arena
RUN apt update
RUN apt install -y curl
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt install -y nodejs git
RUN npm install pm2 -g
COPY --from=base /app /app
RUN cd /app; npm run build:server:prod; npm run build-prod

# Start
WORKDIR /app
RUN ln -s dist/server.js .
COPY --from=base /app/infra/web/start.sh /app/start.sh
RUN chmod +x start.sh
CMD ["./start.sh"]

#############################################################