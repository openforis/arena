############################################################

ARG node_version=22.14.0

FROM node:${node_version} AS arena

COPY . /app/

# Build Arena

WORKDIR /app

RUN --mount=type=secret,id=npm_token,env=NPM_TOKEN echo -e "scripts-prepend-node-path=true\n\
    @openforis:registry=https://npm.pkg.github.com\n\
    always-auth=true\n\
    //npm.pkg.github.com/:_authToken=$NPM_TOKEN\n" > /app/.npmrc \
    && yarn install --ignore-scripts --frozen-lockfile \
    && yarn build \
    && rm -f /app/.npmrc

RUN npm install pm2 -g

# Startup

RUN ln -s dist/server.js .
CMD ["pm2-runtime", "server.js"]

#############################################################