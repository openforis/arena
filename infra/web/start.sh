#!/bin/bash

echo "Starting up web app..."

# Disable RStudio Server authentication (authentication managed by NGINX)
export DISABLE_AUTH=true

# NGINX config: replace PORT and ARENA_PORT placeholders with current environment variables
sed -i -e 's/$ARENA_PORT/'"$ARENA_PORT"'/g' /etc/nginx/sites-available/default
sed -i -e 's/$PORT/'"$PORT"'/g' /etc/nginx/sites-available/default

/init & 
sleep 10 && service nginx start & 
pm2-runtime server.js 