export interface IFilePathStateHolder {
    /**
     * Sets or updates the text state associated with a file identified by its path.
     * @param filePath - The path of the file.
     * @param text - The text content to store.
     * @throws Error if the file is not found by path (implementations may vary).
     */
    setByPath(filePath: string, text: string): void;

    /**
     * Retrieves the text state associated with a file identified by its path.
     * @param filePath - The path of the file.
     * @returns The stored text content, or `undefined` if not found or file not found.
     */
    getByPath(filePath: string): string | undefined;
}
