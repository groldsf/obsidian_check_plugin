export default class MultiMap<K, V> {
    private map: Map<K, V[]>;

    constructor() {
        this.map = new Map();
    }

    // Добавление значения к ключу
    add(key: K, value: V): void {
        if (!this.map.has(key)) {
            this.map.set(key, []);
        }
        this.map.get(key)?.push(value);
    }

    // Получение всех значений для ключа
    get(key: K): V[] | undefined {
        return this.map.get(key);
    }

    // Удаление конкретного значения у ключа
    remove(key: K, value: V): boolean {
        const values = this.map.get(key);
        if (!values) return false;

        const index = values.indexOf(value);
        if (index === -1) return false;

        values.splice(index, 1);

        if (values.length === 0) {
            this.map.delete(key);
        }

        return true;
    }

    // Удаление всех значений у ключа
    delete(key: K): boolean {
        return this.map.delete(key);
    }

    // Проверка существования ключа
    has(key: K): boolean {
        return this.map.has(key);
    }

    // Очистка всей карты
    clear(): void {
        this.map.clear();
    }

    // Итерация по всем парам ключ-значения
    entries(): IterableIterator<[K, V[]]> {
        return this.map.entries();
    }

    // Получение всех ключей
    keys(): IterableIterator<K> {
        return this.map.keys();
    }

    // Получение всех значений
    values(): IterableIterator<V[]> {
        return this.map.values();
    }
}
