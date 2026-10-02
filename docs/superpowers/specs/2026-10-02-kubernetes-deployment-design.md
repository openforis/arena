# Kubernetes Deployment — Design

## Goal

Provide the files needed to deploy Arena on a Kubernetes cluster with `kubectl apply -k`, using the
published `openforis/arena` image: Arena itself, an optional in-cluster PostgreSQL/PostGIS database
and an optional in-cluster RStudio Server for the Analysis module.

## What Arena needs from the platform

Established by reading `Dockerfile`, `.env.template`, `server/system/appCluster.js` and
`@openforis/arena-server`:

- **Image**: `openforis/arena` (Docker Hub, pushed on every `v*` tag). Runs `pm2-runtime server.js`
  as the non-root `node` user (uid 1000) and listens on `ARENA_PORT` (default `9090`).
- **Configuration**: environment variables only (see `.env.template`).
- **Database**: PostgreSQL with PostGIS. Migrations run at startup, before the server listens, and
  boot-time writes are guarded by Postgres advisory locks (`runWithClusterLock`), so no migration Job
  is needed.
- **Health**: `GET /healthcheck` (`@godaddy/terminus`, runs a DB query). Terminus also handles
  `SIGTERM` with a graceful shutdown.
- **Writable paths**: `LOG_FOLDER` (`/app/logs`), `TEMP_FOLDER`, `ANALYSIS_OUTPUT_DIR`, and pm2's home.
- **WebSockets**: socket.io with default transports (HTTP long-polling, then upgrade).
- **Multiple instances**: supported since #4363 (instances coordinate through Postgres
  `LISTEN/NOTIFY`; instance id = pod hostname), provided file storage is S3
  (`docs/superpowers/specs/2026-08-06-heroku-horizontal-autoscaling-design.md`) and the load balancer
  keeps socket.io long-polling requests on the same instance.
- **Build-time client settings**: `ALLOW_USER_ACCESS_REQUEST`, `RECAPTCHA_ENABLED`,
  `RECAPTCHA_SITE_KEY` and `RSTUDIO_DOWNLOAD_SERVER_URL` are baked into the client bundle by
  `webpack.config.babel.js`. Setting them on the pod only affects the server side.

## Decisions

| Topic | Decision |
| --- | --- |
| Packaging | Kustomize: a base plus components, no Helm |
| Database | Both in-cluster and external, as two overlays |
| Exposure | `ingress-nginx` Ingress, TLS certificate issued by cert-manager |
| RStudio | Optional component: one shared `rocker/rstudio` instance at `/rstudio/` |
| Replicas | 1 by default, files stored in the DB; scaling up is documented, not preconfigured |
| Location | `infra/k8s/` |

Out of scope: Helm chart, database backups, HorizontalPodAutoscaler, NetworkPolicies, per-user RStudio
instances, and cleaning up the stale `infra/web`, `infra/desktop` and `infra/nginx` files (they
reference Dockerfile targets that no longer exist).

## Layout

```
infra/k8s/
  README.md
  base/
    kustomization.yaml
    namespace.yaml
    deployment.yaml
    service.yaml
    ingress.yaml
  components/
    postgres/
      kustomization.yaml
      statefulset.yaml
      service.yaml
    rstudio/
      kustomization.yaml
      deployment.yaml
      service.yaml
      pvc.yaml
      ingress.yaml
  overlays/
    in-cluster-db/
      kustomization.yaml
      config.env
      secrets.env.example
    external-db/
      kustomization.yaml
      config.env
      secrets.env.example
```

Database and RStudio are independent and optional, so they are Kustomize **components**: an overlay
lists the ones it wants. One overlay per combination would need four near-identical folders.

Each overlay is deployed with `kubectl apply -k infra/k8s/overlays/<name>`.

## Configuration

- **Non-secret settings**: `config.env` in each overlay, turned into the `arena-config` ConfigMap by
  `configMapGenerator`. The generated name carries a content hash, so a config change rolls the pods.
- **Secrets**: `secrets.env` in each overlay, turned into the `arena-secrets` Secret by
  `secretGenerator`. Only `secrets.env.example` is committed; `infra/k8s/**/secrets.env` is added to
  `.gitignore`. Contains `PGPASSWORD`, `USER_AUTH_TOKEN_SECRET`, `USER_2FA_SECRET`, `ADMIN_EMAIL`,
  `ADMIN_PASSWORD` and the optional email, S3, reCAPTCHA and AI keys.
- **Image tag**: pinned with the Kustomize `images:` transformer in each overlay, never `latest`.
- **Host name and cert-manager issuer**: patched per overlay (JSON patch on the Ingress).
- The base references `arena-config` and `arena-secrets` through `envFrom`; it is not deployable on
  its own, since the generators live in the overlays.

## Base

### Namespace

`arena`. All resources are namespaced through the base `kustomization.yaml`.

### Deployment `arena`

- `replicas: 1`, `RollingUpdate` strategy.
- Container port `9090`; `envFrom` the ConfigMap and the Secret.
- Fixed env in the base: `ARENA_PORT=9090`, `USE_HTTPS=true` (trusts the ingress proxy headers),
  `TEMP_FOLDER=/tmp/arena_upload`, `ANALYSIS_OUTPUT_DIR=/tmp/arena_analysis`, `PM2_HOME=/tmp/.pm2`.
- Probes, all `GET /healthcheck` on the container port:
  - `startupProbe`: every 5 s, up to 5 minutes, to cover startup migrations;
  - `readinessProbe`: every 10 s;
  - `livenessProbe`: every 20 s, 3 failures.
- `terminationGracePeriodSeconds: 60`.
- Resources: requests `250m` CPU / `1Gi` memory, limit `2Gi` memory, no CPU limit. These are starting
  values to be tuned per installation, stated as such in the README.
- Security context: `runAsNonRoot`, uid/gid 1000, `allowPrivilegeEscalation: false`, all capabilities
  dropped, `seccompProfile: RuntimeDefault`.
- Volumes: `emptyDir` on `/app/logs` and `/tmp`.
- `readOnlyRootFilesystem: true` is added only if the image starts and serves requests that way when
  tested (`docker run --read-only` with the same tmpfs mounts); otherwise it is left out and the
  README says why.

### Service `arena`

`ClusterIP`, port `80` to container port `9090`.

### Ingress `arena`

`ingressClassName: nginx`, one host, path `/` to the `arena` Service, TLS secret `arena-tls`.
Annotations:

- `cert-manager.io/cluster-issuer`: issuer name, patched per overlay;
- `nginx.ingress.kubernetes.io/proxy-body-size: 1024m` (matches the default `FILE_UPLOAD_LIMIT`);
- `nginx.ingress.kubernetes.io/proxy-read-timeout` and `proxy-send-timeout: "3600"` (WebSockets, long
  uploads and exports);
- cookie affinity (`affinity: cookie`, `session-cookie-name: arena-affinity`), a no-op with one
  replica and required by socket.io long-polling with more.

## Postgres component

- StatefulSet `arena-db`, 1 replica, image `postgis/postgis:17-3.5` (the one in the README).
- `volumeClaimTemplates`: 20 Gi, default storage class, mounted at `/var/lib/postgresql/data` with
  `PGDATA` set to a subdirectory.
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` taken from the same `PGDATABASE`, `PGUSER`
  (ConfigMap) and `PGPASSWORD` (Secret) keys Arena uses, so credentials are defined once.
- `pg_isready` readiness and liveness probes.
- Headless Service `arena-db`, port `5432`.
- The in-cluster overlay's `config.env` sets `PGHOST=arena-db`, `PGPORT=5432`, `PGSSL=false`.
- Single instance, no replication and no backups: the README states this plainly.

## Overlays

- **`in-cluster-db`**: base + postgres component.
- **`external-db`**: base only; `config.env` points `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER` at the
  external server with `PGSSL=true`.

Both carry a commented-out `components: [../../components/rstudio]` line to enable RStudio.

## RStudio component

- Deployment `arena-rstudio`: `rocker/rstudio` at a pinned version tag, `DISABLE_AUTH=true`
  (authentication is done by the Ingress), container port `8787`.
- PVC `arena-rstudio-home` (5 Gi) mounted at `/home/rstudio`.
- Service `arena-rstudio`, port `8787`.
- A second Ingress on the same host for the `/rstudio/` prefix, with basic auth
  (`auth-type: basic`, `auth-secret: arena-rstudio-auth`). The `arena-rstudio-auth` Secret is generated
  from an `htpasswd` file the operator creates next to `secrets.env` (git-ignored, documented in the
  README). It shares the `arena-tls` certificate.
- No volume is shared with Arena: the R script copied by the user downloads the chain as a zip from
  `/api/public/survey/.../script` and posts results back over HTTP.
- RStudio is opened with `window.open`, not in an iframe, so no `X-Frame-Options` handling is needed.

**Path prefix.** How the current `rocker/rstudio` image behaves under `/rstudio/` (rewrite rule vs
`www-root-path`) is verified locally with Docker and an nginx proxy before the Ingress rules are
written; the result decides the exact annotations.

**Limitation.** It is one shared instance, and the script Arena generates clears the working directory
and workspace when it starts. Two users running chains at the same time overwrite each other. Per-user
instances require the RStudio pool service (`RSTUDIO_POOL_SERVER_URL`). The README says so.

## Server fix: `/api/rstudio` without a pool service

Today the in-cluster RStudio cannot be reached from the UI:

- `RSTUDIO_SERVER_URL` is read only by the client (`webapp/store/ui/chain/actions/openRStudio.js`)
  and is not defined in the client bundle, so it is always empty in a built image.
- The client then calls `GET` and `POST /api/rstudio`, whose handlers in
  `server/modules/rstudio/api/rstudioApi.js` always `axios.post` to `RSTUDIO_POOL_SERVER_URL`. With no
  pool configured the request fails, before the client reaches its `window.location.origin/rstudio/`
  fallback.

Change: when `RSTUDIO_POOL_SERVER_URL` is not set, the `POST`, `GET` and `DELETE /api/rstudio`
handlers respond with an empty JSON object without calling the pool. The client already treats that as
"no instance" and falls back to `/rstudio/` on the same origin; cancelling the dialog calls `DELETE`
with no instance id, which must also succeed. Behaviour with a pool configured is unchanged.

The decision "is a pool configured, and if not what to answer" goes into a small function that can be
unit tested without Express. The RStudio component requires an Arena image released after this change;
the README names the minimum version once known.

## README (`infra/k8s/README.md`)

Written for an operator who knows Kubernetes but not Arena:

- prerequisites (ingress-nginx, cert-manager with a ClusterIssuer, a default storage class);
- first deployment, step by step: pick an overlay, copy `secrets.env.example`, set host, issuer and
  image tag, `kubectl apply -k`, first login with `ADMIN_EMAIL`/`ADMIN_PASSWORD`, then remove
  `ADMIN_PASSWORD`;
- upgrading (bump the image tag);
- enabling RStudio, with its limitation;
- running more than one replica: S3 file storage required, affinity already configured;
- file storage choices (DB, S3; file system needs a PVC and is not preconfigured);
- the build-time client settings that cannot be changed through the ConfigMap;
- what is not covered: database backups, resource tuning.

## Verification

Only Docker is available on the development machine, so tools run as containers or as binaries
downloaded to a scratch folder:

1. `kustomize build` succeeds for both overlays, and for both with the RStudio component enabled.
2. The rendered output passes `kubeconform` schema validation.
3. The Arena image is started with `docker run` using the same security settings and env as the
   Deployment against a PostGIS container, and `/healthcheck` answers; this also settles
   `readOnlyRootFilesystem`.
4. If a `kind` cluster can be created with Docker, the `in-cluster-db` overlay is applied to it (Ingress
   excluded or without TLS) and the Arena pod must become Ready. If that is not possible, the final
   report says the manifests were validated statically only.
5. Unit test for the `/api/rstudio` no-pool behaviour; `yarn test:unit` passes.

## Implementation notes

Changes made while implementing and testing, where the result differs from the design above:

- **Database credentials** (`PGDATABASE`, `PGUSER`, `PGPASSWORD`) are in their own `db.env` file and
  `arena-db-credentials` Secret, read by both Arena and Postgres. With a single ConfigMap/Secret, every
  Arena configuration change would have changed the generated name referenced by the StatefulSet and
  restarted the database.
- **Namespace and common labels** are set in the overlays, not in the base: Kustomize only rewrites
  references to generated ConfigMaps/Secrets within the same namespace, and the generators are in the
  overlays.
- **`ADMIN_EMAIL`** is in `config.env` (it is not a secret and stays after the first startup).
- **`NODE_ENV=production`** is set in the Deployment: the image does not define it.
- **Email credentials are mandatory**: the server exits at startup without them.
- **`readOnlyRootFilesystem: true`** is enabled: the image runs with it, given the two `emptyDir`
  volumes.
- **RStudio path prefix**: the Ingress strips `/rstudio` (`rewrite-target`) and RStudio is told about it
  with `www-root-path=/rstudio`. The setting is delivered by mounting a ConfigMap over
  `/etc/rstudio/disable_auth_rserver.conf`, the file the image copies to `rserver.conf` when
  `DISABLE_AUTH=true`. A rewrite alone loses the prefix on RStudio's redirects.
- **RStudio basic auth Secret** is generated in the overlay (from `rstudio.htpasswd`) with a fixed name,
  since Kustomize does not rewrite names inside annotations.
- **Verification** was done on a local `kind` cluster with ingress-nginx (no cert-manager: the
  certificate issuing was not exercised).
