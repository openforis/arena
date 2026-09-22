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

# npm itself is only needed to install pm2 below; remove its own vendored
# dependencies afterwards rather than carrying their CVEs into the image.
RUN npm install --ignore-scripts pm2@7.0.4 -g \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

WORKDIR /app

COPY --chown=node:node --from=builder /app /app/

# These are build/test-only tools (webpack plugins, babel plugins, node-gyp -
# an optionalDependency of native modules like better-sqlite3, only installed
# from source when no prebuilt binary matches the target platform - and
# jest/playwright test tooling) that dist/server.js never requires at runtime
# - confirmed via grep across the built bundles - but that were otherwise
# shipped into the image just because `yarn install` also installs
# devDependencies (and any optionalDependencies) needed only to produce
# dist/ in the builder stage.
RUN rm -rf \
    node_modules/node-gyp \
    node_modules/wait-on \
    node_modules/playwright \
    node_modules/uglifyjs-webpack-plugin \
    node_modules/@babel/plugin-transform-modules-systemjs

RUN ln -s dist/server.js .

USER node

CMD ["pm2-runtime", "server.js"]

#############################################################