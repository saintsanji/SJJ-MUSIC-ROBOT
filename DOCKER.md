# Docker deployment

The bot supports two NodeLink layouts. Configure the matching settings in `.env` before building.

## Option A: bot and embedded NodeLink in one container

Use loopback for NodeLink and include the embedded service in the image:

```dotenv
NODELINK_HOST=127.0.0.1
NODELINK_PORT=3000
NODELINK_PASS=your_nodelink_password
INCLUDE_NODELINK=true
NODELINK_REPOSITORY=PerformanC/NodeLink
NODELINK_REF=main
```

Build and start:

```sh
docker compose up --build -d
```

The image downloads NodeLink during its build. The entrypoint starts it in the background, waits three seconds, then starts the bot. It passes the configured port and password to NodeLink without storing credentials in the image.

## Option B: connect to an external NodeLink

Set `NODELINK_HOST` to the hostname/IP reachable from the bot container and disable embedding:

```dotenv
NODELINK_HOST=nodelink.example.net
NODELINK_PORT=3000
NODELINK_PASS=your_nodelink_password
INCLUDE_NODELINK=false
```

Then rebuild and start with `docker compose up --build -d`. The entrypoint skips launching NodeLink and starts the bot directly. Do not use `127.0.0.1` for a separate container or machine; loopback refers to the bot container itself.

## Logs and shutdown

```sh
docker compose logs -f music-bot
docker compose down
```

For Pelican/Pterodactyl deployment, import `pelican/egg-ssj-music-robot.json` and follow [PELICAN.md](PELICAN.md).
