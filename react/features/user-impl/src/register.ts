import type { ComponentType } from 'react';
import { container } from '@gaev/container';
import {
  USER_SERVICE, USER_AVATAR, USE_CURRENT_USER,
  type IUserService, type UserAvatarProps, type UseCurrentUser,
} from '@gaev/user-contract';
import { UserService } from './UserService';
import UserAvatar from './UserAvatar';
import useCurrentUser from './useCurrentUser';

container.bind<IUserService>(USER_SERVICE).toDynamicValue(() => new UserService());
container.bind<ComponentType<UserAvatarProps>>(USER_AVATAR).toConstantValue(UserAvatar);
container.bind<UseCurrentUser>(USE_CURRENT_USER).toConstantValue(useCurrentUser);
