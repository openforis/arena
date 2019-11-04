############################################################

FROM node:12-alpine AS base

# Cache these as much as possible:
COPY package.json yarn.lock /app/

RUN cd /app; yarn install --ignore-scripts --frozen-lockfile; npm rebuild node-sass
COPY . /app/

############################################################

FROM node:12-alpine AS prod_builder
RUN apk add --no-cache git jq

# The output of the build stage depends only on these variables,
# because they get baked in to the Web app bundle.
ARG COGNITO_REGION
ARG COGNITO_USER_POOL_ID
ARG COGNITO_CLIENT_ID

ENV COGNITO_REGION ${COGNITO_CLIENT_ID}
ENV COGNITO_USER_POOL_ID ${COGNITO_USER_POOL_ID}
ENV COGNITO_CLIENT_ID ${COGNITO_CLIENT_ID}

# Check that environment variables (Dockerfile arguments) are set:
RUN env; sh -c 'test -n "${COGNITO_CLIENT_ID}"'

COPY --from=base /app /app

RUN cd /app; yarn build-prod; mv dist dist-web
RUN cd /app; yarn build:server:prod

# Only keep the packages needed for server runtime:
RUN cd /app; set -o pipefail; ( \
        jq -r '.devDependencies | keys | .[] ' package.json; \
        jq -r '.arenaClientPackages | keys | .[] | select(. != "META")' package.json; \
    ) | xargs yarn remove --ignore-scripts --no-lockfile --production

############################################################

FROM node:12-alpine AS prod

RUN npm install pm2 -g

COPY --from=prod_builder /app/node_modules /app/node_modules
COPY --from=prod_builder /app/dist /app/dist

COPY --from=prod_builder /app/server/db/migration/ /app/server/db/migration/
COPY --from=prod_builder /app/server/modules/user/api/avatar.png /app/server/modules/user/api/avatar.png

WORKDIR /app
RUN ln -s dist/server.js .
CMD ["pm2-runtime", "server.js"]

#############################################################

FROM nginx:alpine AS prod_web
COPY server/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=prod_builder /app/web-resources/img/ /usr/share/nginx/html/img/
COPY --from=prod_builder /app/dist-web/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

#############################################################

FROM node:12-alpine as test

RUN apk add --no-cache git
COPY --from=base /app /app
RUN cd /app; yarn build:server:dev
WORKDIR /app

#############################################################
