// Svelte Store Mock for standalone testing
// This file provides mock implementations of svelte/store for use outside of Svelte context

export interface Readable<T> {
    subscribe(callback: (value: T) => void): () => void;
}

export interface Writable<T> extends Readable<T> {
    set(value: T): void;
    update(updater: (value: T) => T): void;
}

export interface Subscriber<T> {
    (value: T): void;
}

export interface Unsubscriber {
    (): void;
}

export interface Updater<T> {
    (value: T): T;
}

// Mock writable store
export function writable<T>(value: T): Writable<T> {
    let _value = value;
    const subscribers = new Set<Subscriber<T>>();

    return {
        subscribe(callback: Subscriber<T>): Unsubscriber {
            subscribers.add(callback);
            callback(_value);
            return () => {
                subscribers.delete(callback);
            };
        },
        set(newValue: T): void {
            _value = newValue;
            subscribers.forEach(callback => callback(_value));
        },
        update(updater: Updater<T>): void {
            _value = updater(_value);
            subscribers.forEach(callback => callback(_value));
        }
    };
}

// Mock readable store
export function readable<T>(value: T, start?: (set: (value: T) => void) => (() => void) | void): Readable<T> {
    let _value = value;
    const subscribers = new Set<Subscriber<T>>();
    let stop: (() => void) | void;

    return {
        subscribe(callback: Subscriber<T>): Unsubscriber {
            if (subscribers.size === 0 && start) {
                stop = start((newValue: T) => {
                    _value = newValue;
                    subscribers.forEach(cb => cb(_value));
                });
            }
            
            subscribers.add(callback);
            callback(_value);
            
            return () => {
                subscribers.delete(callback);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = undefined;
                }
            };
        }
    };
}

// Mock derived store
export function derived<T, S>(
    stores: Readable<T> | Readable<T>[],
    fn: (values: T | T[], set: (value: S) => void) => (() => void) | void,
    initialValue?: S
): Readable<S> {
    // Simplified implementation for testing
    const single = !Array.isArray(stores);
    const storesArray = single ? [stores as Readable<T>] : stores as Readable<T>[];
    
    return readable(initialValue as S, (set) => {
        const values: any[] = [];
        const unsubscribers: Unsubscriber[] = [];
        
        storesArray.forEach((store, i) => {
            unsubscribers.push(
                store.subscribe((value) => {
                    values[i] = value;
                    const result = single ? values[0] : values;
                    fn(result, set);
                })
            );
        });
        
        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    });
}

// Mock get function
export function get<T>(store: Readable<T>): T {
    let value: T;
    const unsubscribe = store.subscribe((v) => {
        value = v;
    });
    unsubscribe();
    return value!;
}

// Export all for compatibility
export default {
    writable,
    readable,
    derived,
    get
};
