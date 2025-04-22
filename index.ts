import 'elexis';
import { $IDBBuilder } from './src/structure/$IDBBuilder';

declare module 'elexis' {
    export namespace $ {
        export function idb(name: string, version: number): $IDBBuilder<{version: number, stores: {}}>
    }
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