import 'elexis/core';
import 'elexis/register/method/trycatch';
import { $IDBBuilder } from '#structure/$IDBBuilder';

declare module 'elexis/core' {
    export namespace $ {
        export function idb(name: string, version: number): $IDBBuilder<{version: number, stores: {}}>
    }
}

declare global {

    type TypeofObjectProperty<O, T> = T extends [infer A, ...infer Rest]
        ? A extends keyof O 
            ? [O[A], ...TypeofObjectProperty<O, Rest>] 
            : never
        : T extends string
            ? [T]
            : T;
}

Object.assign($, {
    idb(name: string, version: number) { return new $IDBBuilder(name, version) }
})

export * from "#structure/$IDB";
export * from "#structure/$IDBBuilder";
export * from "#structure/$IDBCursor";
export * from "#structure/$IDBIndex";
export * from "#structure/$IDBObjectStore";
export * from "#structure/$IDBObjectStoreBase";
export * from "#structure/$IDBObjectStoreBuilder";