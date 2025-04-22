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