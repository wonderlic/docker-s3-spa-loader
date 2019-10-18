FROM wonderlic/node:10.15.3-build as build

WORKDIR /build
COPY package.json ./
RUN mkdir /app && \
	npm config set package-lock=false && \
	npm install --only=production && \
	cp -R node_modules /app

COPY config.js handlers.js server.js package.json /app/

#---------------------------------------------------------------------
FROM wonderlic/node:10.15.3-runtime
LABEL maintainer="Wonderlic DevOps <DevOps@wonderlic.com>"

COPY --from=build /app /app
RUN ln -s /usr/local/bin/node /app/s3-spa-loader

CMD ["/app/s3-spa-loader", "/app/server.js"]
