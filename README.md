# wonderlic/s3-spa-loader

### Links

* github: [https://github.com/wonderlic/docker-s3-spa-loader](https://github.com/wonderlic/docker-s3-spa-loader)
* docker hub: [https://registry.hub.docker.com/u/wonderlic/s3-spa-loader/](https://registry.hub.docker.com/u/wonderlic/s3-spa-loader/)

### Description

This docker image will start a node.js webserver and serve the up the primary html file for a single page app based on the incoming hostname.
The files are retrieved from an AWS S3 Bucket (filename should be the same as the hostname that it is for) and cached in local memory.
An AWS SNS Topic can be configured to respond to S3 Events and publish them to the /sns/cache-clear route to refresh cached files when they change.
The /health-check route can be used with a load balancer to verify the service is up and running.

### Usage

```
docker run \
  -e PORT=... \
  -e TRUST_PROXY=... \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=... \
  -e AWS_REGION=... \
  -e AWS_S3_BUCKET_NAME=... \
  wonderlic/s3-spa-loader
```

If not set:
*  PORT defaults to 8080
*  TRUST_PROXY defaults to true
*  AWS_REGION defaults to us-east-1

The AWS S3 Bucket needs to allow the ListBucket and GetObject permissions
