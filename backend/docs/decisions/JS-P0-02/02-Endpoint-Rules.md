# Profile Update API — Validation Rules

## 1. Purpose
Define the request format and validation rules for updating the authenticated user's profile.

## 2. Endpoint
- **Method:** `PATCH`
- **Route:** `/users/me`
- **Authentication:** Required. The backend identifies the user from the authenticated session.

## 3. Request Body

Send a JSON object containing one or both editable fields and the expected profile version.

```json
{
  "displayName": "Harshith",
  "bio": "Computer science student",
  "version": 1
}
```

Only include fields you want to update. The `version` field is used for concurrent-update conflict detection.

## 4. Length Rules

| Field | Rule |
|---|---|
| `displayName` | 1–50 characters after trimming |
| `bio` | Maximum 160 characters after trimming |
| `version` | Must match the current profile version |

## 5. Character Rules
- `displayName` and `bio` must be strings.
- Leading and trailing whitespace is removed.
- Unknown fields are rejected.

## 6. URL Rules
- There is no separate URL field in the current update request.
- URLs included in `bio` are treated as text; URL validation or link processing is not part of the documented rules.

## 7. Normalization Rules
- Trim leading and trailing whitespace from `displayName` and `bio`.
- Store and validate the normalized values.
- Do not assume that capitalization or internal whitespace is changed.

## 8. Empty-Value Rules
- Omitted field: leave its existing value unchanged.
- `displayName: ""` or whitespace only: reject because the normalized value is empty.
- `bio: ""` or whitespace only: store `NULL`, clearing the bio.
- Unknown properties: reject.

## 9. Conflict Resolution
- If `version` matches the current version, apply the update and increment the version.
- If the version is outdated, return `409 Conflict`.
- When a conflict occurs, fetch the latest profile before submitting another update.

## 10. Expected Responses
- `200 OK` — Profile updated successfully.
- `400 Bad Request` — Invalid field, length, empty display name, or invalid version.
- `401 Unauthorized` — Missing or invalid authentication.
- `409 Conflict` — The profile version is outdated.

## 11. Example: Clear the Bio

```json
{
  "bio": "",
  "version": 2
}
```

This clears the bio by storing `NULL`, provided the submitted version is current.

## 12. Important Notes
- Send `Content-Type: application/json`.
- Do not send a user ID; the server derives the account from the authenticated session.
- Keep the latest `version` returned by the API for the next update.
- The documented rules should match the DTO and service implementation; verify that the `version` field is accepted by the current `UpdateProfileDto` before using this request format.