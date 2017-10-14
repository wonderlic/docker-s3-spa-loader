FROM node:6.11.1-alpine
MAINTAINER Wonderlic DevOps <DevOps@wonderlic.com>

COPY helpers /app/helpers
COPY services /app/services
COPY env.js handlers.js server.js /app/

COPY package.json /app/package.json
RUN cd /app && npm install

RUN ln -s /usr/local/bin/node /app/s3-spa-loader

CMD ["/app/s3-spa-loader", "/app/server.js"]
