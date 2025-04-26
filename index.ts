import 'elexis/core';
import 'elexis/method/trycatch';
import { $IDBBuilder } from './src/structure/$IDBBuilder';

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

export * from "./src/structure/$IDB";
export * from "./src/structure/$IDBBuilder";
export * from "./src/structure/$IDBCursor";
export * from "./src/structure/$IDBIndex";
export * from "./src/structure/$IDBObjectStore";
export * from "./src/structure/$IDBObjectStoreBase";
export * from "./src/structure/$IDBObjectStoreBuilder";