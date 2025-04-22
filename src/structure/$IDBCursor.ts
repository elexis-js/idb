export class $IDBCursor {
    cursor: IDBCursorWithValue
    constructor(cursor: IDBCursorWithValue) {
        this.cursor = cursor;
    }

    get value() { return this.cursor.value }
    get key() { return this.cursor.key }
    get primaryKey() { return this.cursor.primaryKey }

    async updateValue<T>(value: T) {
        return new Promise<T>((resolve, reject) => {
            const req = this.cursor.update(value);
            req.onsuccess = e => resolve(value);
            req.onerror = e => reject('IDB Cursor Update Error');
        })
    }

    async deleteCursor() {
        return new Promise<void>((resolve, reject) => {
            const req = this.cursor.delete();
            req.onsuccess = e => resolve();
            req.onerror = e => reject('IDB Cursor Update Error');
        })
    }

    continue(key?: IDBValidKey) { this.cursor.continue(key) }
    advance(count: number) { this.cursor.advance(count) }
}