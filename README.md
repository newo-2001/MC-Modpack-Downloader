# What is this?
This is a collection of scripts to pull minecraft mods from a set of api's given a manifest file.

## Why?
Because all the launchers break every other week and I can't be bothered to switch so I wrote my own scripts.

# How to use

## Prerequisites
- Node.js

## Running the script
If you are downloading from curseforge:
1. Place your `manifest.json` file in the root directory of the project.
2. Open a terminal in this folder and run `npm install` to install required dependencies.
3. Acquire an API key from [the CurseForge website](`https://console.curseforge.com/?#/api-keys`) after logging in.
4. Copy the file `settings.example.json` and rename it to `settings.json`.
5. Replace the `API_KEY_HERE` with your api key in the `settings.json` file.
6. Run the command `node .` from the root directory.
7. Your newly downloaded mods should be located in the `mods` folder.

If you are downloading from modpacks.ch:
1. Place your `manifest.json` file in the root directory of the project.
2. Open a terminal in this folder and run `npm install` to install required dependencies.
3. Copy the file `settings.example.json` and rename it to `settings.json`
4. Open this file and change the fields for `pack_id` and `pack_version` to the corresponding values of the requested modpack.
5. Run the command `node src/modpacks.ch.js` from the root folder
6. Your newly downloaded mods should be located in the `mods` folder.