#!/bin/sh

cd /app

# Check if environment variable 'curseforge_api_key' is set
if [ -z "$MCDL_CURSEFORGE_API_KEY" ]; then
    if [ -z "$curseforge_api_key" ]; then
        echo "Error: Environment variable 'MCDL_CURSEFORGE_API_KEY' is not set"
        exit 1
    else
        echo "Warning: the environment variable 'curseforge_api_key' is deprecated, use 'MCDL_CURSEFORGE_API_KEY' instead"
        export MCDL_CURSEFORGE_API_KEY=$curseforge_api_key
    fi
fi

npm start
