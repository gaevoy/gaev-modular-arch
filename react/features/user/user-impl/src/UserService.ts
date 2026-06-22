import type {
  IUser,
  IUserService
} from '@gaev/user-contract';

export class UserService implements IUserService {
  async getCurrentUser(): Promise<IUser> {
    return {
      id: 'user-1',
      name: 'Alice Smith',
      avatarUrl: `https://api.dicebear.com/7.x/personas/svg?seed=Alice`,
    };
  }
}
