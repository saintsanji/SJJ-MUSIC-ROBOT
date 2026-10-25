FROM node:22.22.2-bookworm-slim AS bot-build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22.22.2-bookworm-slim AS nodelink-build
ARG INCLUDE_NODELINK=true
ARG NODELINK_REPOSITORY=PerformanC/NodeLink
ARG NODELINK_REF=dev
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /opt/nodelink \
    && if [ "$INCLUDE_NODELINK" = "true" ]; then \
         git clone --depth 1 --branch "$NODELINK_REF" "https://github.com/${NODELINK_REPOSITORY}.git" /opt/nodelink \
         && cd /opt/nodelink \
         && npm ci --include=dev \
         && npm prune --omit=dev; \
       else \
         echo 'Building for an external NodeLink endpoint; embedded NodeLink omitted.'; \
       fi

FROM node:22.22.2-bookworm-slim AS runtime

ENV NODE_ENV=production \
    NODELINK_DIR=/opt/nodelink
WORKDIR /app

COPY --from=bot-build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=bot-build --chown=node:node /app/node_modules ./node_modules
COPY --from=bot-build --chown=node:node /app/dist ./dist
COPY --from=nodelink-build --chown=node:node /opt/nodelink /opt/nodelink
COPY --chown=node:node entrypoint.sh nodelink.config.ts ./

USER node
ENTRYPOINT ["bash", "/app/entrypoint.sh"]
