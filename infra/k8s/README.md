# Arena on Kubernetes

[Kustomize](https://kustomize.io/) manifests to deploy Arena with the published
[`openforis/arena`](https://hub.docker.com/r/openforis/arena) image.

```
base/                    Arena: Deployment, Service, Ingress
components/postgres/     optional in-cluster PostgreSQL/PostGIS
components/rstudio/      optional in-cluster RStudio Server
overlays/in-cluster-db/  Arena + in-cluster database
overlays/external-db/    Arena connected to an existing database
```

Pick the overlay matching where your database runs. The base is not deployable on its own.

## Prerequisites

- `kubectl` 1.27 or later (it includes Kustomize).
- [ingress-nginx](https://kubernetes.github.io/ingress-nginx/) as ingress controller.
- [cert-manager](https://cert-manager.io/) with a `ClusterIssuer` for the TLS certificate.
- A default `StorageClass` (in-cluster database and RStudio only).
- A DNS record for the Arena host name pointing at the ingress controller.
- Credentials for an email service (SendGrid, Office 365 or Amazon SES): Arena does not start without them.
- `external-db` only: a PostgreSQL database where the Arena user can create the `postgis` and
  `uuid-ossp` extensions.

## First deployment

All paths are relative to the chosen overlay, e.g. `infra/k8s/overlays/in-cluster-db`.

1. Create the secrets files (they are git-ignored):

   ```console
   $ cp secrets.env.example secrets.env
   $ cp db.env.example db.env
   ```

   Fill in every value that is not commented out. Generate the two token secrets with
   `openssl rand -hex 32`.

2. Edit `config.env`: `ADMIN_EMAIL`, `ARENA_PUBLIC_URL`, the email service and, for `external-db`,
   the database host.

3. Edit `kustomization.yaml`:
   - the host name, in the first patch (two places);
   - the `ClusterIssuer` name, in the second patch;
   - the Arena version, under `images`.

4. Check the result, then deploy:

   ```console
   $ kubectl kustomize . | less
   $ kubectl apply -k .
   $ kubectl -n arena rollout status deployment/arena
   ```

5. Open `https://<host>/` and log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

6. Remove `ADMIN_PASSWORD` from `secrets.env` and run `kubectl apply -k .` again: it is only needed to
   create the system administrator the first time.

## Changing the configuration

Edit `config.env` or `secrets.env` and run `kubectl apply -k .`: the Arena pods are replaced
automatically. See [`.env.template`](../../.env.template) for all the available settings.

These settings are fixed when the image is built, so changing them here only affects the server side,
not the user interface: `ALLOW_USER_ACCESS_REQUEST`, `RECAPTCHA_ENABLED`, `RECAPTCHA_SITE_KEY`,
`RSTUDIO_DOWNLOAD_SERVER_URL`.

ConfigMaps and Secrets of previous configurations are not deleted. To remove them, label-based pruning
can be used: `kubectl apply -k . --prune -l app.kubernetes.io/part-of=arena`.

## Upgrading

Set the new version under `images` in `kustomization.yaml` and run `kubectl apply -k .`.
Database migrations run when the new pod starts. Background jobs running in the old pod are
interrupted.

## Database

**`in-cluster-db`** runs a single PostgreSQL instance (`postgis/postgis`) with a 20 Gi volume.

- There is no replication and **no backup**: set up your own (e.g. a `pg_dump` CronJob or volume
  snapshots).
- `db.env` is only read when the data volume is empty. Changing it later does not change the
  credentials of the existing database.
- The volume size is set in `components/postgres/statefulset.yaml`.

**`external-db`** only needs the connection settings: `PGHOST`, `PGPORT` and `PGSSL` in `config.env`,
database name and credentials in `db.env`.

## File storage

Files attached to records are stored in the database by default. To store them in an S3 bucket, set
the `FILE_STORAGE_AWS_*` variables in `secrets.env`. Storing them on the file system
(`FILE_STORAGE_PATH`) needs a persistent volume mounted in the Arena pod, which these manifests do not
define.

Uploads being processed and analysis output are written to `/tmp`, an `emptyDir` volume on the node's
ephemeral storage.

## Running more than one replica

Arena instances coordinate through the database, with two requirements:

- S3 file storage (see above);
- sticky sessions, already enabled on the Ingress with a cookie.

Then set `spec.replicas` of the `arena` Deployment with a patch in the overlay.

## Resources

The CPU and memory values in the manifests are starting points, not measured recommendations. An idle
Arena instance uses about 650 Mi of memory. Adjust them with patches in the overlay.

## RStudio Server (optional)

Adds one RStudio Server instance at `https://<host>/rstudio/`, opened by the Analysis module to run
processing chains. It requires an Arena version **later than v2.9.5**.

1. Create the users allowed to access it:

   ```console
   $ htpasswd -c rstudio.htpasswd <user>
   ```

2. In `kustomization.yaml`, uncomment the `../../components/rstudio` component and the
   `arena-rstudio-auth` secret generator.

3. Run `kubectl apply -k .`.

Limits to be aware of:

- **It is a single instance shared by all users.** The script Arena generates clears the RStudio
  working directory and workspace when it starts, so two users running analyses at the same time
  overwrite each other's work. Per-user instances need an RStudio pool service
  (`RSTUDIO_POOL_SERVER_URL`), not included here.
- RStudio has no authentication of its own: it is protected by the basic auth of the Ingress only.
  Anyone with that password can run R code in the pod.
- RStudio downloads the analysis scripts from the public Arena URL and sends the results back to it,
  so the pod must be able to reach `https://<host>/`.

Users who prefer not to share an instance can still run processing chains in RStudio installed on
their own computer: that option does not need this component.

## Not covered

Database backups, autoscaling, NetworkPolicies and monitoring.
