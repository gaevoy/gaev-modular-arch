# User Feature

Provides current-user identity — fetching the logged-in user's profile and exposing it as a component, a hook, and a service through the IoC container.

**Owner:** TBD

## Packages

| Package | npm name |
|---|---|
| `user-contract/` | `@gaev/user-contract` |
| `user-impl/` | `@gaev/user-impl` |

## Key contracts exported

| Export | Kind | Description |
|---|---|---|
| `IUser` | interface | `{ id, name, avatarUrl }` |
| `IUserService` | interface | `getCurrentUser(): Promise<IUser>` |
| `UseCurrentUser` | hook type | `() => { user: IUser \| null; loading: boolean }` |
| `UserAvatarProps` | props interface | `{ userId: string; size?: 'sm' \| 'md' \| 'lg' }` |
| `USER_SERVICE` | symbol | IoC binding key for `IUserService` |
| `USER_AVATAR` | symbol | IoC binding key for the `UserAvatar` component |
| `USE_CURRENT_USER` | symbol | IoC binding key for the `useCurrentUser` hook |
| `USER_PAGE` | symbol | IoC binding key for the `UserPage` component |
| `USER_SYMBOLS` | symbol[] | All symbols for `registerBundle` |

## Cross-feature dependencies

None. User is a leaf feature — no other feature packages are imported.
