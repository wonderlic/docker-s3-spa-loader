FROM wonderlic/node:lts-10-build as build

WORKDIR /build
COPY package.json ./
RUN npm install --only=production

#---------------------------------------------------------------------
FROM wonderlic/node:lts-10-runtime
LABEL maintainer="Wonderlic DevOps <DevOps@wonderlic.com>"

WORKDIR /app
COPY --from=build /build/node_modules ./node_modules
COPY config.js handlers.js server.js package.json ./

RUN ln -s /usr/bin/node /app/s3-spa-loader

CMD ["/app/s3-spa-loader", "/app/server.js"]
