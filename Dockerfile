############################################################

FROM node:12-alpine AS base
RUN apk add --no-cache git

# Cache these as much as possible:
COPY package.json yarn.lock /app/

RUN cd /app; yarn install --ignore-scripts --frozen-lockfile; npm rebuild node-sass

COPY .git /app/.git
RUN cd /app; git reset --hard

############################################################

FROM node:12-alpine AS prod_builder
RUN apk add --no-cache git jq

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
COPY --from=prod_builder /app/server/run_nginx.sh /run_nginx.sh
COPY --from=prod_builder /app/server/nginx_backend.conf.envsubst /etc/nginx/conf.d/backend.conf.envsubst
COPY --from=prod_builder /app/server/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=prod_builder /app/web-resources/img/ /usr/share/nginx/html/img/
COPY --from=prod_builder /app/dist-web/ /usr/share/nginx/html/
EXPOSE 80
WORKDIR /usr/share/nginx/html

RUN mv index.html index.html.envsubst

# Avoid a bunch of 404 log spam:
RUN touch favicon.ico

CMD ["/run_nginx.sh"]

#############################################################

FROM node:12-alpine as test
RUN apk add --no-cache git

COPY --from=base /app /app
RUN cd /app; yarn build:server:dev
WORKDIR /app

#############################################################
