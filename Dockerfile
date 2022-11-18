############################################################

ARG node_version=14.17.0

FROM node:${node_version} AS arena

ARG NPM_TOKEN

COPY . /app/

# Build Arena

WORKDIR /app

RUN echo -e "scripts-prepend-node-path=true\n\
    @openforis:registry=https://npm.pkg.github.com\n\
    always-auth=true\n\
    //npm.pkg.github.com/:_authToken=$NPM_TOKEN\n" > /app/.npmrc

RUN yarn install --frozen-lockfile \
    && yarn build \
    && npm rebuild node-sass \
    && rm -r /app/.npmrc

RUN npm install pm2 -g

# Startup

RUN ln -s dist/server.js .
CMD ["pm2-runtime", "server.js"]

#############################################################