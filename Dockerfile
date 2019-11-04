FROM node:12-alpine AS base

# git is currently required for the version string:
RUN apk add --no-cache git

# cache these as much as possible:
COPY package.json yarn.lock /app/

RUN cd /app; yarn --ignore-scripts; npm rebuild node-sass

COPY . /app
RUN cd /app; yarn run npm-run-all build-prod build:server:prod

# Only keep the packages needed for runtime:
# TODO: maybe separate out client-side dependencies out from here:
RUN cd /app; npm prune --production


FROM node:12-alpine AS prod

RUN npm install pm2 -g

COPY --from=base /app/dist /app
COPY --from=base /app/node_modules /app/node_modules

WORKDIR /app
CMD ["pm2-runtime", "server.js"]
