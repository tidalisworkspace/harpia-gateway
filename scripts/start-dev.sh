#!/bin/sh
. ~/.nvm/nvm.sh
docker compose up -d && nvm i && npm run dev