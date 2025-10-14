ARG NODE_VERSION=22.13

FROM halopsa-sync-base:dev AS dev_local
USER root
RUN mkdir /db \
  && chown node:node /db
USER node
WORKDIR /home/node/projects/server
COPY --chown=node:node ./server/package*.json ./
RUN npm ci
CMD ["node_modules/.bin/nodemon"]


## Production build -- assumes build context is [ROOT]/projects
FROM node:${NODE_VERSION} AS prod_build
WORKDIR /root/build/server
COPY server/*.json ./
COPY server/src ./src
RUN npm ci \
  && npm run build


## Production target
FROM node:${NODE_VERSION} AS prod
RUN apt update \
  && mkdir /db \
  && chown node:node /db 
USER node
WORKDIR /app
COPY --chown=node:node --from=prod_build /root/build/server/dist ./dist
COPY --chown=node:node ./server/package*.json ./
RUN npm ci --omit=dev
CMD ["node", "dist/src/server.js"]

