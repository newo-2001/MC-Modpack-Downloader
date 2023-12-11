# What is this?
This is a script to pull minecraft mods from a set of api's given a manifest file.

### Why?
Because all the launchers break every other week and I can't be bothered to switch so I wrote my own script.

### Problem?
If you run into any issues whilst trying to use the script or just don't understand what you're doing, feel free to open an issue, I'm happy to help.

# How to use

## Prerequisites
- [Node.js](https://nodejs.org/en)

This project has been tested for Node 19.7.0. If you are experiencing any issues on other versions, please open an issue on [GitHub](https://github.com/newo-2001/MC-Modpack-Downloader) and I will see what I can do to support the version you are using.

## Initial setup
If this is your first time running the script you have to perform some additional setup:
1. Open a terminal in this folder and run the command `npm install`.  
:information_source: This is the only step that has to be repeated after pulling a new version of the script.
2. Copy the file `settings.example.json` and rename it to `settings.json`.
3. Acquire an API key from [the CurseForge website](https://console.curseforge.com/?#/api-keys) after logging in.
4. Replace the `API_KEY_HERE` under the curseforge section with your api key in the `settings.json` file.  
:information_source: Note that this step is still required, even if you don't intend on downloading from CurseForge.
Other providers (modpacks.ch) might delegate the download to CurseForge behind the scenes.

## Running the scripts
Before downloading a modpack, you need to figure out where you are downloading it from. Currently CurseForge and modpacks.ch (FTB) are supported. If you are sourcing your modpacks from a different provider, please let me know by opening a [GitHub issue](https://github.com/newo-2001/MC-Modpack-Downloader/issues), I will try to add support for it if possible.

There are slight differences between the two:
- CurseForge uses a manifest file to identify a modpack, whereas modpacks.ch uses an id specified in the config.
- For CurseForge this script only downloads the `.jar` files for the mods, as the other files are provided in the archive containing the `manifest.json` file, whereas for modpacks.ch all of the files for the modpack are downloaded by the script.

If you've used the script before, make sure to clean out the `mods` directory first. Specific instructions for your provider of choice follow below.

If you are downloading from CurseForge:
1. Download the archive for your modpack of choice from the [CurseForge website](https://www.curseforge.com/minecraft/search?class=modpacks).
2. Place the `manifest.json` file contained in the archive in the root directory of the project.
3. Open a terminal in the root directory and run the command `npm run curseforge`.
4. Your newly downloaded mods should be located in the output directory (default: `mods`).

If you are downloading from modpacks.ch:
1. Open `settings.json` and change the values in the `modpacks.ch -> modpack` field to the corresponding values found on the page for the modpack in question on the [feed-the-beast website](https://www.feed-the-beast.com/). For more information see the [settings](#settings) section.
2. Open a terminal in the root directory and run the command `npm run modpacks.ch`.
3. Your newly downloaded modpack should be located in the output directory (default: `mods`).

The script might come back saying some mods did not have a download url, this happens because mod authors can choose to disable API downloads on CurseForge to better monetize their work. If you get these messages, you will have to manually download these from somewhere (probably the [CurseForge website](https://www.curseforge.com/minecraft/).) When manually downloading, make sure the version number matches.

Refer to [Using the downloaded files](#using-the-downloaded-files), to install the modpack.

## Using the downloaded files
The downloaded files can be used with virtually any launcher that allows for creating custom profiles. These instructions are written for MultiMC, but similar steps should apply to whatever launcher you are using.

1. Create a new instance in MultiMC by click `Add Instance`.
2. Give it an appropriate name and select the correct minecraft version.
3. After the instance is created, click `Edit Instance` and navigate to the `Version` tab.
4. Press `Install Forge` (or Fabric if applicable), you probably want the recommended version.
5. Press the `Open .minecraft` button
6. - If you downloaded the files from CurseForge you want to create a new directory called `mods` and drag the files downloaded by the script in here. You will also want to drag the rest of the files that came with the `.zip` besides `manifest.json` into this directory *next to the mods folder*.
   - If you downloaded with modpacks.ch you want to drag all the files downloaded by the script into this directory directly.

## Settings
The `settings.json` file provides several options to customize your experience.
- **Concurrency** - This defines the amount of downloads that will happen at the same time.  
⚠️ Changing this to a high value has the risk of downloads timing out due to exhausting system resources.
- **Output Directory** is the directory in which the downloaded files will be placed. The output directory is relative to this directory.
- **Curseforge** This section contains settings for the `CurseForge` mod provider, these **might** be used by other providers.
    - **Api Key** - CurseForge requires users of their api to provide an api key. You can get yours for free on [their website](https://console.curseforge.com/?#/api-keys) after logging in.  
    ⚠️ This key is sensative information, you shouldn't post it online.
- **Modpacks.ch** This section contains settings for the `Modpacks.ch` mod provider, these **won't** be used by other providers.
    - **Modpack** - This block uniquely identifies the modpack you are trying to download. These values can be found on the [ftb website](https://www.feed-the-beast.com/) on the page of the respective modpack. It should look something like the image below.  
    ![](docs/images/ftb_pack_id.png)