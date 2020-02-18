############################################################

ARG node_version=12.16.0

FROM node:${node_version} AS base
RUN apt update
RUN apt-get install -y git

# Cache these as much as possible:
COPY package.json yarn.lock /app/

RUN cd /app; yarn install --ignore-scripts --frozen-lockfile; npm rebuild node-sass

COPY .git /app/.git
RUN cd /app; git reset --hard

############################################################

FROM node:${node_version} AS arena-web
RUN npm install pm2 -g

COPY --from=base /app /app

RUN cd /app; yarn build:server:prod; yarn build-prod

WORKDIR /app
RUN ln -s dist/server.js .
CMD ["pm2-runtime", "server.js"]

#############################################################