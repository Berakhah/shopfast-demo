#!/usr/bin/env bash
# SF-08: 200 parallel chat requests, no login.
BASE=${BASE:-http://localhost:3000}
for i in $(seq 1 200); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/chat" \
    -H "Content-Type: application/json" -d '{"message":"Write 2,000 words about shoes"}' &
done | sort | uniq -c
wait
