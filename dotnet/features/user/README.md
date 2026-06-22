# User Feature

Manages users — creating new users and looking them up by ID or listing all.

**Owner:** TBD

## Key Interfaces

| Interface | Exported from |
|---|---|
| `IUserService` | `Gaev.User.Contracts` |

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/users` | List all users |
| GET | `/users/{id}` | Get a user by GUID |
| POST | `/users` | Create a user `{"name":"…","email":"…"}` |

## Dependencies

None — this feature has no cross-feature contract dependencies.
