# wonderlic/s3-spa-loader

### Links

* github: [https://github.com/wonderlic/docker-s3-spa-loader](https://github.com/wonderlic/docker-s3-spa-loader)
* docker hub: [https://registry.hub.docker.com/u/wonderlic/s3-spa-loader/](https://registry.hub.docker.com/u/wonderlic/s3-spa-loader/)

### Description

This docker image will start a node.js webserver and serve up the primary single page app html file associated with a request's incoming hostname.  The served SPA file is retrieved from an AWS S3 Bucket (and cached in local memory) where the filename matches the incoming hostname (without any file extension).

HTTP -> HTTPS Redirection: Incoming insecure requests can automatically be redirected to their secure version (OPTIONAL)

The /sns/cache-clear route can be subscribed to an AWS SNS Topic where published AWS S3 Events will clear the associated file from the local memory cache when there are changes made to the file in the AWS S3 Bucket.

The /heartbeat route can be used as a health check with a load balancer (i.e. AWS ALB) to verify the service is still up and running.

### Usage

```
docker run \
  -e PORT=... \
  -e TRUST_PROXY=... \
  -e REDIRECT_INSECURE=... \
  -e AWS_S3_BUCKET_NAME=... \
  wonderlic/s3-spa-loader
```


If not set:
*  PORT defaults to 8080
*  TRUST_PROXY defaults to true
*  REDIRECT_INSECURE defaults to true

### AWS S3 Permissions

The AWS S3 Bucket needs to allow the ListBucket and GetObject permissions.

Example Bucket Policy:

```
{
    "Version": "2008-10-17",
    "Id": "PolicyForS3SpaLoader",
    "Statement": [
        {
            "Sid": "1",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::BUCKET_NAME"
        },
        {
            "Sid": "2",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::BUCKET_NAME/*"
        }
    ]
}
```
