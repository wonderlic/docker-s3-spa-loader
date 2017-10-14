FROM node:6.11.4-alpine
MAINTAINER Wonderlic DevOps <DevOps@wonderlic.com>

RUN mkdir /app && \
    cp env.js /app && \
    cp handlers.js /app && \
    cp server.js /app && \
    cp package.json /app && \
    cd /app && \
    npm install --production && \
    rm /app/package.json && \
    ln -s /usr/local/bin/node /app/s3-spa-loader

CMD ["/app/s3-spa-loader", "/app/server.js"]
