#!/usr/bin/env bash
# SF-01: find a service_role key in the JavaScript any visitor downloads.
BASE=${BASE:-http://localhost:3000}
curl -s "$BASE/login" | grep -o '/_next/static/chunks/[^"]*\.js' | sort -u | while read -r c; do
  curl -s "$BASE$c" | grep -o 'eyJhbGciOi[A-Za-z0-9._-]*' | while read -r jwt; do
    payload=$(echo "$jwt" | cut -d. -f2 | tr '_-' '/+'); while [ $(( ${#payload} % 4 )) -ne 0 ]; do payload="$payload="; done
    echo "found in $c"; echo "  token:   ${jwt:0:20}…[REDACTED]"; echo "  payload: $(echo "$payload" | base64 -d 2>/dev/null)"
  done
done
