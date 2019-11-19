# Infrastructure

OpenForis Arena infrastructure configuration and deployment is automated using [Pulumi](https://www.pulumi.com/), and uses AWS.

The runtime environment uses AWS ECS behind a load balancer. The test environment is running with this configuration at [https://test.openforis-arena.org/].

## Logging
Container logs use AWS CloudWatch.

The use of [awslogs](https://github.com/jorgebastida/awslogs) is recommended for viewing the logs.
