FROM wonderlic/node:20-alpine-builder as build

WORKDIR /build
COPY package.json ./
RUN npm install --only=production

#---------------------------------------------------------------------
FROM wonderlic/node:20-alpine
LABEL maintainer="Wonderlic DevOps <DevOps@wonderlic.com>"

WORKDIR /app
COPY --from=build /build/node_modules ./node_modules
COPY config.js handlers.js server.js package.json ./

RUN ln -s /usr/local/bin/node /app/s3-spa-loader

CMD ["/app/s3-spa-loader", "/app/server.js"]
