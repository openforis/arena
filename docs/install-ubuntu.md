# Install Arena on Ubuntu Server

Quick guide to run Arena on a single Ubuntu Server LTS machine (22.04 or 24.04) with Docker, PostgreSQL/PostGIS
and nginx as HTTPS reverse proxy. For hardware and storage sizing see [Server requirements](server-requirements.md);
for a Kubernetes cluster see the [Kubernetes deployment](../infra/k8s/README.md).

## 1. Install Docker

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
```

## 2. Start PostgreSQL with PostGIS

```bash
docker run -d --name arena-db --restart unless-stopped \
  -p 127.0.0.1:5444:5432 --shm-size=1g \
  -v arena-data:/var/lib/postgresql/data \
  -e POSTGRES_DB=arena -e POSTGRES_USER=arena -e POSTGRES_PASSWORD=CHANGE_ME \
  postgis/postgis:17-3.5
```

- `127.0.0.1:5444`: the database is reachable only from the server itself.
- `--shm-size=1g`: the default 64 MB of shared memory makes parallel queries fail.
- `-v arena-data:...`: the data is kept in a named volume when the container is recreated.

An existing or managed PostgreSQL can be used instead: its user must be able to create the `postgis` and
`uuid-ossp` extensions.

## 3. Create the folders and the `arena.env` file

```bash
sudo mkdir -p /opt/arena/{upload,files,analysis}
sudo chown -R 1000:1000 /opt/arena
```

The Arena container runs as the `node` user (uid 1000), which must be able to write into these folders.

Create `/opt/arena/arena.env` with at least these parameters (all the available ones are in
[`.env.template`](../.env.template)):

```properties
ARENA_PORT=9090

PGHOST=localhost
PGPORT=5444
PGDATABASE=arena
PGUSER=arena
PGPASSWORD=CHANGE_ME

TEMP_FOLDER=/opt/arena/upload
FILE_STORAGE_PATH=/opt/arena/files
ANALYSIS_OUTPUT_DIR=/opt/arena/analysis

# Email service (sendgrid / office365 / amazonSES): Arena does not start without it
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_key

RECAPTCHA_ENABLED=false

# Secrets used to sign the login tokens and encrypt the 2FA secrets: Arena does not start without them.
# Use long random values, e.g. generated with: openssl rand -hex 32
USER_AUTH_TOKEN_SECRET=CHANGE_ME_RANDOM_SECRET_1
USER_2FA_SECRET=CHANGE_ME_RANDOM_SECRET_2

# System admin created on the first startup
ADMIN_EMAIL=admin@example.org
ADMIN_PASSWORD=a_strong_password
```

Protect the file, since it contains passwords; it must stay readable by your user, because `docker run --env-file`
reads it before starting the container:

```bash
sudo chown $USER:$USER /opt/arena/arena.env
sudo chmod 600 /opt/arena/arena.env
```

## 4. Run Arena

```bash
docker run -d --name arena --restart unless-stopped \
  --env-file /opt/arena/arena.env --network host \
  -v /opt/arena:/opt/arena \
  openforis/arena:latest
docker logs -f arena
```

If the container keeps restarting, the reason is in the first error of `docker logs arena`: usually a required
parameter missing from `arena.env` (e.g. `USER_AUTH_TOKEN_SECRET environment variable is required`) or the database
not reachable on `PGHOST`:`PGPORT`. Fix `arena.env`, then recreate the container (`docker rm -f arena` and the same
`docker run` command): `docker restart` does not reload the env file.

Open `http://<server-ip>:9090` and log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Then remove `ADMIN_PASSWORD`
from `arena.env` and change the password in Arena (**Change password**).

## 5. HTTPS with nginx and Let's Encrypt

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/arena` (replace `arena.example.org` with your domain, whose DNS must point to
the server):

```nginx
server {
  server_name arena.example.org;
  client_max_body_size 1G;

  location / {
    proxy_pass http://localhost:9090/;
    proxy_http_version 1.1;
    # WebSocket support (jobs progress, notifications)
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```

`client_max_body_size` must allow the largest file uploaded (survey and data imports, backups).

```bash
sudo ln -s /etc/nginx/sites-available/arena /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d arena.example.org
```

Allow only SSH and web traffic through the firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 6. Update Arena

Pull the new image and recreate the container with the same `docker run` command of step 4; database
migrations run automatically on startup.

```bash
docker pull openforis/arena:latest
docker rm -f arena
```

## 7. Backups

Back up the database and the files folder every day and keep the copies on a different machine:

```bash
docker exec arena-db pg_dump -U arena -Fc arena > arena_$(date +%F).dump
```

Restore a dump with `pg_restore` and test it periodically.

## Optional: RStudio Server for the analysis

```bash
docker run -d --name arena-rstudio --restart unless-stopped --network host \
  -v /opt/arena/analysis:/home/rstudio -e DISABLE_AUTH=true rocker/rstudio
```

RStudio listens on port 8787 without authentication: don't expose that port, publish it through nginx with basic
authentication instead (see the `/rstudio/` location in [`infra/nginx/nginx.conf`](../infra/nginx/nginx.conf)).
