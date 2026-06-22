import type { IUser } from './IUser';
export interface IUserService {
    getCurrentUser(): Promise<IUser>;
}
export const USER_SERVICE = Symbol.for('@gaev/user/USER_SERVICE');
