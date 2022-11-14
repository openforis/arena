############################################################

ARG NPM_TOKEN
ARG node_version=14.17.0

FROM node:${node_version} AS arena

ARG NPM_TOKEN
ENV NPM_TOKEN $NPM_TOKEN

# RUN apt update && apt upgrade -y
# RUN apt autoremove && apt autoclean

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

# Prepare start script

RUN ln -s dist/server.js .
RUN ln -s /app/infra/web/start.sh /app/start.sh
RUN chmod +x start.sh
CMD ["./start.sh"]

#############################################################