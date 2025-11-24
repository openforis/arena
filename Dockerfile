############################################################

ARG node_version=24.11.1

FROM node:${node_version} AS arena

# Enable Corepack for Yarn Modern
RUN corepack enable

COPY . /app/

# Build Arena

WORKDIR /app

RUN --mount=type=secret,id=npm_token,env=NPM_TOKEN \
    yarn install --immutable \
    && yarn build \
    && npm install pm2 -g \
    && ln -s dist/server.js .

CMD ["pm2-runtime", "server.js"]

#############################################################