import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

// Mock the modules
vi.mock('fs/promises');
vi.mock('glob');

describe('build-pages script', () => {
    let buildPages;

    beforeEach(async () => {
        // Reset mocks and dynamically import the script before each test
        vi.resetAllMocks();
        const module = await import('./build-pages.js');
        buildPages = module.default; // Assuming the main function is exported as default
    });

    it('should correctly build an HTML page from partials', async () => {
        // Arrange: Mock the file system and glob results
        const baseHtml = '<html><head></head><body>{{HEADER}}{{PAGE_CONTENT}}{{FOOTER}}</body></html>';
        const headerHtml = '<header>Header</header>';
        const footerHtml = '<footer>Footer</footer>';
        const pageContentHtml = '<h1>Hello World</h1>';
        const expectedOutputHtml = '<html><head></head><body><header>Header</header><h1>Hello World</h1><footer>Footer</footer></body></html>';

        glob.mockResolvedValue(['index.html']);
        fs.readFile.mockImplementation((filePath) => {
            if (filePath.includes('base.html')) return Promise.resolve(baseHtml);
            if (filePath.includes('header.html')) return Promise.resolve(headerHtml);
            if (filePath.includes('footer.html')) return Promise.resolve(footerHtml);
            if (filePath.includes('index.html')) return Promise.resolve(pageContentHtml);
            return Promise.reject(new Error(`File not found: ${filePath}`));
        });

        // Act: Run the build script
        await buildPages();

        // Assert: Check that the correct file was written with the correct content
        expect(fs.writeFile).toHaveBeenCalledOnce();
        const [writePath, writeContent] = fs.writeFile.mock.calls[0];
        expect(path.basename(writePath)).toBe('index.html');
        expect(writeContent).toBe(expectedOutputHtml);
    });

    it('should handle cases where no page files are found', async () => {
        // Arrange: Mock glob to return an empty array
        glob.mockResolvedValue([]);
        fs.readFile.mockResolvedValue('<html></html>'); // Mock base template read

        // Act: Run the build script
        await buildPages();

        // Assert: Ensure no files were written
        expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should exit gracefully if a required template file is missing', async () => {
        // Arrange: Mock glob to find a page, but mock fs.readFile to fail for the base template
        glob.mockResolvedValue(['index.html']);
        fs.readFile.mockImplementation((filePath) => {
            if (filePath.includes('base.html')) {
                const error = new Error('ENOENT: no such file or directory');
                error.code = 'ENOENT';
                return Promise.reject(error);
            }
            return Promise.resolve('');
        });

        // Mock process.exit to prevent the test runner from exiting
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});

        // Act: Run the build script
        await buildPages();

        // Assert: Check that process.exit was called with an error code
        expect(exitSpy).toHaveBeenCalledWith(1);
        exitSpy.mockRestore();
    });
});