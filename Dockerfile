############################################################

ARG node_version=24.22.3

# Build stage: needs the full image (compilers/headers) to install
# dependencies and run the webpack build. Not shipped to runtime.
FROM node:${node_version}-trixie AS builder

# Enable Corepack for Yarn Modern
RUN corepack enable

COPY . /app/

WORKDIR /app

# After the build, reinstall node_modules with production dependencies only:
# devDependencies (webpack, babel, eslint, jest, playwright...) are only needed
# to produce dist/ and would otherwise be shipped in the runtime image with
# their own vulnerabilities. dist/*.js only requires production dependencies
# (and their transitive ones) at runtime.
RUN yarn install --immutable --mode=skip-build \
    && yarn build \
    && YARN_ENABLE_SCRIPTS=false yarn workspaces focus --production \
    && find node_modules -name .devcontainer -prune -exec rm -rf {} +

# Of the server sources only the non-TS assets (R scripts read from __dirname by the analysis chains)
# and the files parsed by swagger-jsdoc (apis in server/system/swaggerInitializer.ts) are read at runtime.
# mobile-preview/ is missing when its (non fatal) download failed: create it for the COPY below.
RUN find server -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*Api.ts' ! -path 'server/apiDocs/*' -delete \
    && mkdir -p mobile-preview

############################################################

# Runtime stage: slim base has no need for the build-only OS packages
# (ImageMagick, MariaDB/GLib/OpenSSL headers, etc.) pulled in by the
# full node image, which otherwise sit unused in the final image.
# Debian 13 (trixie) instead of Debian 12 (bookworm): most of the OS package
# vulnerabilities reported by trivy on bookworm have no fix available there.
FROM node:${node_version}-trixie-slim AS arena

# Apply the available OS security updates on top of the base image
RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*

# pm2 is installed as a local package (not with `npm install -g`) from a
# lockfile, so that its dependency tree is pinned (and `overrides` can be added
# there for vulnerable dependencies if needed).
# npm itself is only needed to install pm2; remove it (and its own vendored
# dependencies) afterwards rather than carrying their CVEs into the image.
WORKDIR /opt/pm2
COPY docker/pm2/package.json docker/pm2/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
    && ln -s /opt/pm2/node_modules/.bin/pm2 /opt/pm2/node_modules/.bin/pm2-runtime /usr/local/bin/ \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /root/.npm

WORKDIR /app

# Only what the server reads at runtime (paths relative to /app, the working directory and ARENA_ROOT)
COPY --chown=node:node --from=builder /app/package.json /app/CHANGELOG.md /app/
COPY --chown=node:node --from=builder /app/node_modules /app/node_modules/
COPY --chown=node:node --from=builder /app/dist /app/dist/
COPY --chown=node:node --from=builder /app/server /app/server/
COPY --chown=node:node --from=builder /app/web-resources/img /app/web-resources/img/
COPY --chown=node:node --from=builder /app/web-resources/geo /app/web-resources/geo/
COPY --chown=node:node --from=builder /app/mobile-preview /app/mobile-preview/

# /app is owned by root: create the default log folder (LOG_FOLDER, ./logs) writable by the node user
RUN ln -s dist/server.js . \
    && mkdir -p logs \
    && chown node:node logs

USER node

CMD ["pm2-runtime", "server.js"]

#############################################################
