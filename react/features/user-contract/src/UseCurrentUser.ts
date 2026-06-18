import type { IUser } from './IUser';
export type UseCurrentUser = () => { user: IUser | null; loading: boolean };
export const USE_CURRENT_USER = Symbol.for('@gaev/user/USE_CURRENT_USER');
