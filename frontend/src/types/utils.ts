export type UnknownDict = Record<string, unknown>;
export type ID = string;

export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

export type Nullable<T> = T | null | undefined;
export type ValueOf<T> = T[keyof T];
export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
