FROM node:6.11.1-slim
MAINTAINER Wonderlic DevOps <DevOps@wonderlic.com>

COPY helpers services env.js handlers.js package.json server.js /app

RUN cd /app && npm install

RUN ln -s /usr/local/bin/node /app/s3-spa-loader

CMD ["/app/s3-spa-loader", "/app/server.js"]
