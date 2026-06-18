import type { IUser } from './IUser';
export abstract class IUserService { abstract getCurrentUser(): Promise<IUser>; }
export const USER_SERVICE = Symbol.for('@gaev/user/USER_SERVICE');
