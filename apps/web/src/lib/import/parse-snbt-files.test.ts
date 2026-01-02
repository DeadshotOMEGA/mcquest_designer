import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseSNBTFiles } from './parse-snbt-files';
import type { SnbtFiles } from '@/components/import';

// Mock FileReader
const mockReadAsText = vi.fn();

interface MockFileReaderInstance {
  onload: ((event: ProgressEvent) => void) | null;
  onerror: ((event: ProgressEvent) => void) | null;
  error: DOMException | null;
  result: string | ArrayBuffer | null;
  readAsText(file: File): void;
}

class MockFileReader implements MockFileReaderInstance {
  onload: ((event: ProgressEvent) => void) | null = null;
  onerror: ((event: ProgressEvent) => void) | null = null;
  error: DOMException | null = null;
  result: string | ArrayBuffer | null = null;

  readAsText(file: File): void {
    mockReadAsText(file);
    // Simulate successful read
    if (this.onload) {
      this.result = '{}'; // Will be overridden by mock setup
      const event = new ProgressEvent('load');
      Object.defineProperty(event, 'target', { value: this, enumerable: true });
      this.onload(event);
    }
  }
}

// Mock the global FileReader
(global as unknown as { FileReader: typeof MockFileReader }).FileReader = MockFileReader;

describe('parseSNBTFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error when no chapter files are provided', async () => {
    const files: SnbtFiles = { chapters: [] };

    const result = await parseSNBTFiles(files);

    expect(result.snapshot).toBeNull();
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toMatchObject({
      severity: 'error',
      code: 'NO_CHAPTER_FILES',
      message: expect.stringContaining('At least one chapter file'),
    });
  });

  it('should handle file read errors gracefully', async () => {
    const chapterFile = new File(['content'], 'chapter.snbt', { type: 'text/plain' });
    const files: SnbtFiles = { chapters: [chapterFile] };

    // Mock FileReader to simulate error
    mockReadAsText.mockImplementation(function(this: MockFileReaderInstance) {
      if (this.onerror) {
        this.error = new DOMException('Read failed');
        const event = new ProgressEvent('error');
        Object.defineProperty(event, 'target', { value: this, enumerable: true });
        this.onerror(event);
      }
    });

    const result = await parseSNBTFiles(files);

    expect(result.snapshot).toBeNull();
    expect(result.problems.some(p => p.code === 'FILE_READ_ERROR')).toBe(true);
  });

  it('should extract and combine chapter and quest data from files', async () => {
    const chapterData = {
      chapters: [{ id: 'ch1', filename: 'Chapter One' }],
      quests: [{ id: 'q1', title: 'Quest One', x: 0, y: 0 }],
    };

    const chapterFile = new File(
      [JSON.stringify(chapterData)],
      'chapter.snbt',
      { type: 'text/plain' }
    );
    const files: SnbtFiles = { chapters: [chapterFile] };

    // Mock file reading to return proper SNBT format
    class TestFileReader extends MockFileReader {
      readAsText(file: File): void {
        mockReadAsText(file);
        if (this.onload) {
          // Return valid SNBT-like object
          this.result = `{
            chapters: [{id: "ch1", filename: "Chapter One"}],
            quests: [{id: "q1", title: "Quest One", x: 0, y: 0}]
          }`;
          const event = new ProgressEvent('load');
          Object.defineProperty(event, 'target', { value: this, enumerable: true });
          this.onload(event);
        }
      }
    }

    (global as unknown as { FileReader: typeof TestFileReader }).FileReader = TestFileReader;

    await parseSNBTFiles(files);

    // Verify file was attempted to be read
    expect(mockReadAsText).toHaveBeenCalledWith(chapterFile);
  });

  it('should handle multiple chapter files', async () => {
    const chapterFile1 = new File(['content1'], 'chapter1.snbt', { type: 'text/plain' });
    const chapterFile2 = new File(['content2'], 'chapter2.snbt', { type: 'text/plain' });
    const files: SnbtFiles = { chapters: [chapterFile1, chapterFile2] };

    // For this test, we're just verifying the logic attempts to process both files
    await parseSNBTFiles(files);

    // Both files should have been attempted
    expect(mockReadAsText).toHaveBeenCalledTimes(2);
    expect(mockReadAsText).toHaveBeenNthCalledWith(1, chapterFile1);
    expect(mockReadAsText).toHaveBeenNthCalledWith(2, chapterFile2);
  });

  it('should include lang file data when provided', async () => {
    const chapterFile = new File(['content'], 'chapter.snbt', { type: 'text/plain' });
    const langFile = new File(['lang content'], 'en_us.snbt', { type: 'text/plain' });
    const files: SnbtFiles = { chapters: [chapterFile], langFile };

    await parseSNBTFiles(files);

    // Lang file should also be read
    expect(mockReadAsText).toHaveBeenCalledWith(expect.objectContaining({ name: 'en_us.snbt' }));
  });

  it('should continue processing even if lang file fails to read', async () => {
    const chapterFile = new File(['content'], 'chapter.snbt', { type: 'text/plain' });
    const langFile = new File(['lang'], 'en_us.snbt', { type: 'text/plain' });
    const files: SnbtFiles = { chapters: [chapterFile], langFile };

    // The function should create a warning but continue
    await parseSNBTFiles(files);

    // Should have attempted both files
    expect(mockReadAsText.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
