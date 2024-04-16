#!/bin/sh

cd /app

# Check if environment variable 'curseforge_api_key' is set
if [ -z "$curseforge_api_key" ]; then
    echo "Error: Environment variable 'curseforge_api_key' is not set"
    exit 1
fi

echo {\"curseforge\": { \"apiKey\": \""$curseforge_api_key"\"}} > ./settings.json

npm start