import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { glob } from 'glob';
import fs from 'fs/promises';

// Mock the modules
vi.mock('glob');
vi.mock('fs/promises');

describe('add-lang script', () => {
    let addLangAttribute;

    beforeEach(async () => {
        // Reset mocks before each test
        vi.resetAllMocks();
        // Dynamically import the script to use the mocked modules
        const module = await import('./add-lang.js');
        addLangAttribute = module.default;
    });

    it('should add lang="en" to an html tag that is missing it', async () => {
        const mockHtml = '<html><head></head><body></body></html>';
        const expectedHtml = '<html lang="en"><head></head><body></body></html>';

        glob.mockResolvedValue(['index.html']);
        fs.readFile.mockResolvedValue(mockHtml);

        await addLangAttribute();

        expect(fs.writeFile).toHaveBeenCalledOnce();
        expect(fs.writeFile).toHaveBeenCalledWith(expect.any(String), expectedHtml, 'utf8');
    });

    it('should NOT modify an html tag that already has lang="en"', async () => {
        const mockHtml = '<html lang="en"><head></head><body></body></html>';

        glob.mockResolvedValue(['index.html']);
        fs.readFile.mockResolvedValue(mockHtml);

        await addLangAttribute();

        expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should NOT modify an html tag that already has a different lang attribute', async () => {
        const mockHtml = '<html lang="es"><head></head><body></body></html>';

        glob.mockResolvedValue(['index.html']);
        fs.readFile.mockResolvedValue(mockHtml);

        await addLangAttribute();

        expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should handle file read errors gracefully', async () => {
        glob.mockResolvedValue(['error.html']);
        fs.readFile.mockRejectedValue(new Error('File not found'));

        await expect(addLangAttribute()).resolves.toBeUndefined();
        expect(fs.writeFile).not.toHaveBeenCalled();
    });
});