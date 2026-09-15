# Request Lifecycle

## Successful request

A request moves through the NestJS application in this order:

1. Client sends HTTP request.
2. Request ID middleware checks `X-Request-Id`.
3. If no request ID exists, the server generates one.
4. The request ID is added to the response header.
5. The controller receives the HTTP parameters.
6. Controller validates query/path values.
7. Controller calls the appropriate service.
8. Service applies product behavior.
9. Service calls the repository.
10. Fixture repository reads the fixture data.
11. Service maps internal data into the API response DTO.
12. Controller returns the response.
13. Logging middleware records method, path, status, duration, and request ID.

## Error request

If validation fails:

```text
Request
  ↓
Controller validation
  ↓
BadRequestException
  ↓
Global HTTP exception filter
  ↓
400 VALIDATION_ERROR


## Unknown data request
If a requested record does not exist:
```text
Request
  ↓
Controller
  ↓
Service
  ↓
Repository returns null
  ↓
NotFoundException
  ↓
404 NOT_FOUND

##Repository Failure

If an unexpected repository failure occurs:
```text
Request
  ↓
Repository failure
  ↓
Global HTTP exception filter
  ↓
500 INTERNAL_ERROR