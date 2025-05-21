import { IFilePathStateHolder } from "src/IFilePathStateHolder";

export class InMemoryFilePathStateHolder implements IFilePathStateHolder {
	private states: Map<string, string>;

	constructor() {
		this.states = new Map<string, string>();
	}

	public setByPath(filePath: string, text: string): void {
		console.log(`InMemoryFileStateHolder: Setting state for "${filePath}"`);
		this.states.set(filePath, text);
	}

	public getByPath(filePath: string): string | undefined {
		const state = this.states.get(filePath);
		console.log(`InMemoryFileStateHolder: Getting state for "${filePath}". Found: ${!!state}`);
		return state;
	}

	// Вспомогательные методы для тестов (не часть интерфейса, но полезны)
	public clear(): void {
		this.states.clear();
	}

	public getInternalState(filePath: string): string | undefined {
		return this.states.get(filePath); // Для прямых проверок в тестах
	}

	public setInitialStates(initialStates: Record<string, string>): void {
		for (const path in initialStates) {
			this.states.set(path, initialStates[path]);
		}
	}
}
