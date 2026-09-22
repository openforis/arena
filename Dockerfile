############################################################

ARG node_version=24.21.0

# Build stage: needs the full image (compilers/headers) to install
# dependencies and run the webpack build. Not shipped to runtime.
FROM node:${node_version} AS builder

# Enable Corepack for Yarn Modern
RUN corepack enable

COPY . /app/

WORKDIR /app

RUN yarn install --immutable --mode=skip-build \
    && yarn build

############################################################

# Runtime stage: slim base has no need for the build-only OS packages
# (ImageMagick, MariaDB/GLib/OpenSSL headers, etc.) pulled in by the
# full node image, which otherwise sit unused in the final image.
FROM node:${node_version}-bookworm-slim AS arena

RUN npm install pm2 -g

WORKDIR /app

COPY --from=builder /app /app/

RUN ln -s dist/server.js .

CMD ["pm2-runtime", "server.js"]

#############################################################