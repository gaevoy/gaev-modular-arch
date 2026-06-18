import type { IUser } from '@gaev/user-contract';
import { IUserService } from '@gaev/user-contract';

export class UserService extends IUserService {
  async getCurrentUser(): Promise<IUser> {
    return {
      id: 'user-1',
      name: 'Alice Smith',
      avatarUrl: `https://api.dicebear.com/7.x/personas/svg?seed=Alice`,
    };
  }
}
