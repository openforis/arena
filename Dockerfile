############################################################

ARG node_version=12.16.0

FROM node:${node_version} AS base
RUN apt update
RUN apt-get install -y git netcat

# Cache these as much as possible:
COPY package.json yarn.lock /app/

RUN cd /app; yarn install --ignore-scripts --frozen-lockfile; npm rebuild node-sass

COPY .git /app/.git
RUN cd /app; git reset --hard

############################################################

FROM node:${node_version} AS prod_builder
RUN apt-get install -y git

COPY --from=base /app /app

RUN cd /app; yarn build-prod
# RUN mv dist dist-web
RUN cd /app; yarn build:server:prod

# Only keep the packages needed for server runtime:
#RUN cd /app; set -o pipefail; ( \
#        jq -r '.devDependencies | keys | .[] ' package.json; \
#        jq -r '.arenaClientPackages | keys | .[] | select(. != "META")' package.json; \
#    ) | xargs yarn remove --ignore-scripts --no-lockfile --production

############################################################

FROM node:${node_version} AS arena-web
RUN npm install pm2 -g

COPY --from=base /app /app
# COPY --from=prod_builder /app/node_modules /app/node_modules
# COPY --from=prod_builder /app/dist /app/dist

# COPY --from=prod_builder /app/server/db/migration/ /app/server/db/migration/
# COPY --from=prod_builder /app/server/modules/user/api/avatar.png /app/server/modules/user/api/avatar.png

WORKDIR /app
RUN ln -s dist/server.js .
#CMD ["pm2-runtime", "server.js"]
CMD ["node", "server.js"]

#############################################################

# FROM nginx:alpine AS arena-web
# COPY --from=prod_builder /app/server/run_nginx.sh /run_nginx.sh
# COPY --from=prod_builder /app/server/nginx_backend.conf.envsubst /etc/nginx/conf.d/backend.conf.envsubst
# COPY --from=prod_builder /app/server/nginx.conf /etc/nginx/conf.d/default.conf
# COPY --from=prod_builder /app/web-resources/img/ /usr/share/nginx/html/img/
# COPY --from=prod_builder /app/dist-web/ /usr/share/nginx/html/
# EXPOSE 80
# WORKDIR /usr/share/nginx/html

# RUN mv index.html index.html.envsubst

# # Avoid a bunch of 404 log spam:
# RUN touch favicon.ico

# CMD ["/run_nginx.sh"]

# #############################################################

# FROM node:${node_version} as test
# RUN apt-get install -y git

# COPY --from=base /app /app
# RUN cd /app; yarn build:server:dev
# WORKDIR /app

#############################################################
