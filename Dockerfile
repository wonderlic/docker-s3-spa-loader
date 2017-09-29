FROM node:6.11.1-slim
MAINTAINER Wonderlic DevOps <DevOps@wonderlic.com>

COPY app /app/app
COPY helpers /app/helpers
COPY services /app/services
COPY env.js /app/env.js
COPY server.js /app/server.js

COPY package.json /app/package.json
RUN cd /app && npm install

RUN ln -s /usr/local/bin/node /app/s3-spa-loader

CMD ["/app/s3-spa-loader", "/app/server.js"]
