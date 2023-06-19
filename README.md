# What is this?
This is a collection of scripts to pull minecraft mods from a set of api's given a manifest file.

## Why?
Because all the launchers break every other week and I can't be bothered to switch so I wrote my own scripts.

# How to use

## Prerequisites
- [Node.js](https://nodejs.org/en)
- NPM (Node Package Manager), comes with Node.js

This project has been tested for Node 19.7.0.
If you are experiencing any issues on other versions, please open an issue on [GitHub](https://github.com/newo-2001/MC-Modpack-Downloader) and I may consider backporting support to older versions of Node.

## Installing external dependencies
If this is your first time running one of the scripts or you have downloaded a newer version, you have to download the required external dependencies from NPM. The instructions for which are listed below.
1. Open a terminal in this folder and run the command `npm install`

## Running the scripts
If you are downloading from curseforge:
1. Place your `manifest.json` file in the root directory of the project.
2. Acquire an API key from [the CurseForge website](https://console.curseforge.com/?#/api-keys) after logging in.
3. Copy the file `settings.example.json` and rename it to `settings.json`.
4. Replace the `API_KEY_HERE` with your api key in the `settings.json` file.
5. Open a terminal in the root directory and run the command `npm run curseforge`.
6. Your newly downloaded mods should be located in the output directory (default: `mods`).

If you are downloading from modpacks.ch:
1. Copy the file `settings.example.json` and rename it to `settings.json`.
2. Open this file and change the values in the `modpack` field to the corresponding values found on the [feed-the-beast website](https://www.feed-the-beast.com/).
3. Open a terminal in the root directory and run the command `npm run modpacks.ch`.
4. Your newly downloaded mods should be located in the output directory (default: `mods`).