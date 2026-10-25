# Pelican and Pterodactyl deployment

Import `pelican/egg-ssj-music-robot.json` from the panel's administrator area under **Nests / Eggs**. The egg uses Node.js 22.22.2 or newer, clones the configured public GitHub repository/ref during installation, runs `npm ci --include=dev`, and compiles the bot with `npm run build`. At runtime, the egg invokes `entrypoint.sh`; `npm start` remains available for running only the compiled bot when NodeLink is already started separately.

## Choose a NodeLink layout

**Option A: embedded NodeLink.** Leave `NODELINK_HOST` as `127.0.0.1`. During installation, the egg also clones and installs the configured NodeLink source. On startup, the entrypoint starts NodeLink in the background, waits three seconds, and then starts the bot in the same Pelican container. The NodeLink server binds to `0.0.0.0` inside the container while the bot connects over loopback.

**Option B: external NodeLink.** Set `NODELINK_HOST` to the external hostname/IP reachable from the bot container. The egg installer skips the embedded NodeLink download, and the entrypoint starts only the bot. Do not use `127.0.0.1` for a NodeLink service in another container or machine; that address refers to this bot container.

## Configure the server

Set the egg variables in the server's Startup configuration:

- `DISCORD_TOKEN`: bot token from the Discord Developer Portal. Treat it as a password.
- `CLIENT_ID`: required Discord application ID, used by the slash-command deployment script.
- `GUILD_ID`: optional test guild ID. Set it for guild-scoped command deployment; leave blank for global deployment.
- `NODELINK_HOST`: use `127.0.0.1` for Option A or a reachable hostname/IP for Option B.
- `NODELINK_PORT`: NodeLink server port, default `3000` to match this project's NodeLink setup.
- `NODELINK_PASS`: the NodeLink server password.
- `NODELINK_SECURE`: `true` when NodeLink uses TLS/WSS; otherwise `false`.
- `GITHUB_REPOSITORY`: public bot repository in `owner/repository` format. Defaults to `saintsanji/SJJ-MUSIC-ROBOT`.
- `GITHUB_REF`: bot branch or tag to install. Defaults to the `v0.2.1` release tag.
- `NODELINK_SOURCE_REPOSITORY`: embedded NodeLink repository, used for Option A. Defaults to `PerformanC/NodeLink`.
- `NODELINK_SOURCE_REF`: embedded NodeLink branch or tag. Defaults to `main`.

NodeLink must allow connections from the bot container/network and its firewall must permit the configured port. The bot does not need an inbound port allocation.

## Register slash commands

Register the slash commands once for the Discord application. From a local clone with `DISCORD_TOKEN` and `CLIENT_ID` configured, run:

```sh
npm ci
npm run deploy
```

Alternatively, run `npm run deploy` from the server console after installation, provided `DISCORD_TOKEN` and `CLIENT_ID` are set in its environment. The deploy script registers global commands, which can take some time to appear in Discord.

## Install updates

For a later release, create and push a Git tag, set `GITHUB_REF` to that tag, and reinstall the Pelican server so it fetches and builds that source. For a fork, set `GITHUB_REPOSITORY` to the fork and choose its desired branch or tag in `GITHUB_REF`.

## Multiple Discord servers

One bot process can serve multiple Discord guilds. Do not run several copies with the same bot token for horizontal scaling unless the application is deliberately configured for Discord sharding; ordinary duplicate gateway sessions can disconnect or conflict with each other. Each Pelican server should normally use a distinct bot application/token if it is an independent instance.