# Server requirements

What is needed to host your own Arena instance, for example for a National Forest Inventory (NFI): software,
hardware, storage and supporting infrastructure. The figures are **indicative estimates** to plan a budget, not
measured benchmarks: adjust them to the number of plots, files and users of your inventory.

Arena is a web application: field teams, data cleaners and analysts use it with a web browser. Data can also be
collected offline with Arena Mobile and then synchronized with the server. Arena is open source: there are no
license costs, only hosting, storage, backups and administration.

## Software

All free and open source:

- Linux server (e.g. Ubuntu Server LTS) with [Docker](https://www.docker.com/): Arena is distributed as the
  [`openforis/arena`](https://hub.docker.com/r/openforis/arena) Docker image. For a Kubernetes cluster, see
  the [Kubernetes deployment](../infra/k8s/README.md).
- PostgreSQL with the PostGIS extension (e.g. the `postgis/postgis:17-3.5` image), on the same machine or as
  a managed database service (AWS RDS, Azure Database for PostgreSQL, Google Cloud SQL...). The database user
  must be able to create the `postgis` and `uuid-ossp` extensions.
- Optional: RStudio Server, for the statistical analysis module (analysis chains).

## Hardware

|                                | Pilot / small inventory | Full NFI                              |
| ------------------------------ | ----------------------- | ------------------------------------- |
| CPU                            | 2–4 vCPU                | 4–8 vCPU                              |
| RAM                            | 8 GB                    | 16–32 GB                              |
| Disk (SSD)                     | 100 GB                  | 300–500 GB, expandable                |
| Analysis (RStudio, optional)   | same server             | separate VM, 4 vCPU / 16 GB RAM       |

For a full NFI, prefer separate machines for the application and the database (or a managed PostgreSQL
service): backups, monitoring and scaling are easier.

## Storage capacity

The tabular data is small: typically a few hundred KB per plot record, so even several thousand plots take a
few GB. The storage is driven by the **attached files, mostly photos** (around 2–5 MB each):

> plots × files per plot × ~3 MB + ~10 GB for database and system, then × 2 for growth and multiple cycles

For example, 5,000 plots with 10 photos each take about 150 GB of photos alone.

Files can be stored in the database (default), in a folder of the server file system (`FILE_STORAGE_PATH`) or
in an Amazon S3 bucket (`FILE_STORAGE_AWS_S3_*`), see [`.env.template`](../.env.template). With many photos,
object storage (S3) is usually the cheapest and most scalable option, and keeps the database small.

## Supporting infrastructure

- **Backups:** automated daily backups of the database and of the files, stored in a different location than
  the server, with a periodic restore test. Plan 2–3 × the data size for backup storage.
- **Domain name and HTTPS certificate** (e.g. free [Let's Encrypt](https://letsencrypt.org/) certificates).
- **Email service** (SendGrid, Office 365 or Amazon SES), used for user invitations and password resets:
  Arena does not start without it.
- **Network:** stable internet connection, with a public IP address when self-hosted. Bandwidth needs are
  modest, except during bulk uploads of photos.
- **System administration:** a person (part-time) to apply OS updates, update Arena and monitor disk space
  and backups.

## Hosting options

- **Cloud** (AWS, Azure, Google Cloud or a national provider): indicatively USD 50–100 per month for a pilot
  and USD 150–400 per month for a full NFI, storage and backups included, depending on provider and region.
- **On premises** (national data center or institution): hardware and staff costs only, but power,
  connectivity, physical security and off-site backups must be guaranteed.
