############################################################

ARG node_version=18.12.1

FROM node:${node_version} AS arena

COPY . /app/

# Build Arena

WORKDIR /app

RUN --mount=type=secret,id=NPM_TOKEN <<EOT
  set -e
  npm config set //registry.npmjs.org/:_authToken $(cat /run/secrets/NPM_TOKEN)
  yarn install --frozen-lockfile \
    && yarn build \
    && npm rebuild node-sass
EOT

RUN npm install pm2 -g

# Startup

RUN ln -s dist/server.js .
CMD ["pm2-runtime", "server.js"]

#############################################################