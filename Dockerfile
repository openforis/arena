############################################################

ARG node_version=24.21.0

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
    && YARN_ENABLE_SCRIPTS=false yarn workspaces focus --production

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

# pm2 is installed as a local package (not with `npm install -g`) so that
# `overrides` can be applied to its pinned dependencies (js-yaml 4.3.1 is
# vulnerable to CVE-2026-84375).
# npm itself is only needed to install pm2; remove it (and its own vendored
# dependencies) afterwards rather than carrying their CVEs into the image.
WORKDIR /opt/pm2
RUN echo '{"private":true,"dependencies":{"pm2":"7.0.4"},"overrides":{"js-yaml":"^4.3.2"}}' > package.json \
    && npm install --omit=dev --ignore-scripts --no-audit --no-fund \
    && ln -s /opt/pm2/node_modules/.bin/pm2 /opt/pm2/node_modules/.bin/pm2-runtime /usr/local/bin/ \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /root/.npm

WORKDIR /app

COPY --chown=node:node --from=builder /app /app/

RUN ln -s dist/server.js .

USER node

CMD ["pm2-runtime", "server.js"]

#############################################################
