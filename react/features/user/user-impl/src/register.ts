import type { ComponentType } from 'react';
import { container } from '@gaev/container';
import {
  USER_SERVICE,
  USER_AVATAR,
  USER_PAGE,
  USE_CURRENT_USER,
  type IUserService,
  type UserAvatarProps,
  type UserPageProps,
  type UseCurrentUser,
} from '@gaev/user-contract';
import { UserService } from './UserService';
import UserAvatar from './UserAvatar';
import useCurrentUser from './useCurrentUser';
import UserPage from './UserPage';

container.bind<IUserService>(USER_SERVICE).toDynamicValue(() => new UserService());
container.bind<ComponentType<UserAvatarProps>>(USER_AVATAR).toConstantValue(UserAvatar);
container.bind<UseCurrentUser>(USE_CURRENT_USER).toConstantValue(useCurrentUser);
container.bind<ComponentType<UserPageProps>>(USER_PAGE).toConstantValue(UserPage);
