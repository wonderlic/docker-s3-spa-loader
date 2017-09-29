FROM node:6.11.1-slim
MAINTAINER Wonderlic DevOps <DevOps@wonderlic.com>

COPY app /app/app
COPY helpers /app/helpers
COPY node_modules /app/node_modules
COPY services /app/services
COPY env.js /app/env.js
COPY server.js /app/server.js

RUN ln -s /usr/local/bin/node /app/s3-spa-loader

CMD ["/app/s3-spa-loader", "/app/server.js"]
