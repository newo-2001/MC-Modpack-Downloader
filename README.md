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
2. Open this file and change the values in the `modpacks.ch -> modpack` field to the corresponding values found on the [feed-the-beast website](https://www.feed-the-beast.com/).
3. Open a terminal in the root directory and run the command `npm run modpacks.ch`.
4. Your newly downloaded mods should be located in the output directory (default: `mods`).

## Using the downloaded files with MultiMC
1. Create a new instance in MultiMC by click `Add Instance`.
2. Give it an appropriate name and select the correct minecraft version.
3. After the instance is created, click `Edit Instance` and navigate to the `Version` tab.
4. Press `Install Forge` (or Fabric if applicable), you probably want the recommended version.
5. Press the `Open .minecraft` button
6. - If you downloaded the files from CurseForge you want to create a new directory called `mods` and drag the downloaded files in here. Don't forget to manually download any mods that reported having no download url.
   - If you downloaded with modpacks.ch you want to drag all the downloaded files into directory directly.

## Settings
The `settings.json` file provides several options to customize your experience.
- **Concurrency** - This defines the amount of downloads that will happen at the same time.
    
    :warning: *Changing this to a high value has the risk of downloads timing out due to exhausting system resources.*
- **Output Directory** is the directory in which the downloaded files will be placed. The output directory is relative to this directory.
- **Curseforge** This section contains settings for the `CurseForge` mod provider, these won't be used by other providers.
    - **Api Key** - CurseForge requires users of their api to provide an api key. You can get yours for free on [their website](https://console.curseforge.com/?#/api-keys) after logging in.
    
        :warning: *This key is sensative information, you shouldn't post it online.*
- **Modpacks.ch** This section contains settings for the `Modpacks.ch` mod provider, these won't be used by other providers.
    - **Modpack** - This block uniquely identifies the modpack you are trying to download. These values can be found on the [ftb website](https://www.feed-the-beast.com/).