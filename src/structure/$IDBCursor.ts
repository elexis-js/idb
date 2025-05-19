import type { $IDBObjectStoreOptions } from "#structure/$IDBObjectStore";

export class $IDBCursor<Options extends $IDBObjectStoreOptions, KeyPath extends string | string[]> {
    cursor: IDBCursorWithValue
    constructor(cursor: IDBCursorWithValue) {
        this.cursor = cursor;
    }

    get value(): Options['type'] { return this.cursor.value }
    get key(): TypeofObjectProperty<Options['type'], KeyPath> { return this.cursor.key as any }
    get primaryKey(): TypeofObjectProperty<Options['type'], Options['keyPath']> { return this.cursor.primaryKey as any }

    async update<T extends Options['type']>(value: T) {
        return new Promise<T>((resolve, reject) => {
            const req = this.cursor.update(value);
            req.onsuccess = e => resolve(value);
            req.onerror = e => reject('IDB Cursor Update Error');
        })
    }

    async delete() {
        return new Promise<void>((resolve, reject) => {
            const req = this.cursor.delete();
            req.onsuccess = e => resolve();
            req.onerror = e => reject('IDB Cursor Update Error');
        })
    }

    continue(key?: IDBValidKey) { this.cursor.continue(key) }
    advance(count: number) { this.cursor.advance(count) }
    abort() { this.cursor.request.transaction?.abort() }
}