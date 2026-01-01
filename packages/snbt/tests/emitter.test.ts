import { describe, it, expect } from 'vitest';
import { emitSNBT } from '../src/emitter';

describe('emitSNBT', () => {
  describe('primitives', () => {
    it('emits null', () => {
      expect(emitSNBT(null)).toBe('null');
    });

    it('emits undefined as null', () => {
      expect(emitSNBT(undefined)).toBe('null');
    });

    it('emits booleans', () => {
      expect(emitSNBT(true)).toBe('true');
      expect(emitSNBT(false)).toBe('false');
    });

    it('emits integers', () => {
      expect(emitSNBT(0)).toBe('0');
      expect(emitSNBT(42)).toBe('42');
      expect(emitSNBT(-123)).toBe('-123');
    });

    it('emits floats with decimal point and d suffix', () => {
      expect(emitSNBT(1.5)).toBe('1.5d');
      expect(emitSNBT(0.1)).toBe('0.1d');
      expect(emitSNBT(-3.7)).toBe('-3.7d');
    });

    it('emits integers without suffix (JavaScript cannot distinguish 1.0 from 1)', () => {
      // In JavaScript, 1.0 === 1, so these will be emitted as integers
      expect(emitSNBT(1)).toBe('1');
      expect(emitSNBT(42)).toBe('42');
    });

    it('emits strings with quotes', () => {
      expect(emitSNBT('hello')).toBe('"hello"');
      expect(emitSNBT('world')).toBe('"world"');
    });
  });

  describe('string escaping', () => {
    it('escapes double quotes', () => {
      expect(emitSNBT('say "hello"')).toBe('"say \\"hello\\""');
    });

    it('escapes backslashes', () => {
      expect(emitSNBT('path\\to\\file')).toBe('"path\\\\to\\\\file"');
    });

    it('escapes newlines', () => {
      expect(emitSNBT('line1\nline2')).toBe('"line1\\nline2"');
    });

    it('escapes carriage returns', () => {
      expect(emitSNBT('line1\rline2')).toBe('"line1\\rline2"');
    });

    it('escapes tabs', () => {
      expect(emitSNBT('col1\tcol2')).toBe('"col1\\tcol2"');
    });

    it('escapes complex strings', () => {
      expect(emitSNBT('say "hello\\nworld"')).toBe(
        '"say \\"hello\\\\nworld\\""'
      );
    });
  });

  describe('arrays in FTB format', () => {
    it('emits empty array', () => {
      expect(emitSNBT([])).toBe('[]');
    });

    it('emits simple array on separate lines', () => {
      const result = emitSNBT([1, 2, 3], { format: 'ftb' });
      expect(result).toBe('[\n\t1\n\t2\n\t3\n]');
    });

    it('emits array of strings', () => {
      const result = emitSNBT(['a', 'b', 'c'], { format: 'ftb' });
      expect(result).toBe('[\n\t"a"\n\t"b"\n\t"c"\n]');
    });

    it('emits array of objects', () => {
      const result = emitSNBT([{ id: 'test' }], { format: 'ftb' });
      const expected = '[\n\t{\n\t\tid: "test"\n\t}\n]';
      expect(result).toBe(expected);
    });

    it('emits nested arrays', () => {
      const result = emitSNBT([[1, 2], [3, 4]], { format: 'ftb' });
      const expected = '[\n\t[\n\t\t1\n\t\t2\n\t]\n\t[\n\t\t3\n\t\t4\n\t]\n]';
      expect(result).toBe(expected);
    });
  });

  describe('arrays in standard format', () => {
    it('emits simple array comma-separated', () => {
      const result = emitSNBT([1, 2, 3], { format: 'standard' });
      expect(result).toBe('[1, 2, 3]');
    });

    it('emits array of strings', () => {
      const result = emitSNBT(['a', 'b'], { format: 'standard' });
      expect(result).toBe('["a", "b"]');
    });

    it('emits nested arrays', () => {
      const result = emitSNBT([[1, 2], [3, 4]], { format: 'standard' });
      expect(result).toBe('[[1, 2], [3, 4]]');
    });
  });

  describe('objects in FTB format', () => {
    it('emits empty object', () => {
      expect(emitSNBT({})).toBe('{}');
    });

    it('emits simple object', () => {
      const result = emitSNBT({ name: 'test' }, { format: 'ftb' });
      const expected = '{\n\tname: "test"\n}';
      expect(result).toBe(expected);
    });

    it('emits object with multiple fields', () => {
      const result = emitSNBT(
        { name: 'test', value: 42 },
        { format: 'ftb' }
      );
      // Fields should be sorted alphabetically
      const expected = '{\n\tname: "test"\n\tvalue: 42\n}';
      expect(result).toBe(expected);
    });

    it('sorts object keys for deterministic output', () => {
      const obj1 = { z: 1, a: 2, m: 3 };
      const obj2 = { a: 2, m: 3, z: 1 };
      const result1 = emitSNBT(obj1, { format: 'ftb' });
      const result2 = emitSNBT(obj2, { format: 'ftb' });
      expect(result1).toBe(result2);
    });

    it('emits nested objects', () => {
      const result = emitSNBT(
        { outer: { inner: 'value' } },
        { format: 'ftb' }
      );
      const expected = '{\n\touter: {\n\t\tinner: "value"\n\t}\n}';
      expect(result).toBe(expected);
    });

    it('emits object with array field', () => {
      const result = emitSNBT(
        { items: [1, 2, 3] },
        { format: 'ftb' }
      );
      const expected = '{\n\titems: [\n\t\t1\n\t\t2\n\t\t3\n\t]\n}';
      expect(result).toBe(expected);
    });

    it('emits deeply nested structure', () => {
      const data = {
        level1: {
          level2: {
            level3: 'deep'
          }
        }
      };
      const result = emitSNBT(data, { format: 'ftb' });
      expect(result).toContain('level1');
      expect(result).toContain('level2');
      expect(result).toContain('level3');
      expect(result).toContain('"deep"');
    });
  });

  describe('objects in standard format', () => {
    it('emits simple object', () => {
      const result = emitSNBT({ name: 'test' }, { format: 'standard' });
      expect(result).toBe('{name: "test"}');
    });

    it('emits object with multiple fields comma-separated', () => {
      const result = emitSNBT(
        { name: 'test', value: 42 },
        { format: 'standard' }
      );
      expect(result).toBe('{name: "test", value: 42}');
    });
  });

  describe('FTB Quests format (real examples)', () => {
    it('emits FTB data.snbt style object', () => {
      const data = {
        default_autoclaim_rewards: 'disabled',
        default_consume_items: false,
        detection_delay: 20,
        drop_book_on_death: false,
        grid_scale: 0.5,
        version: 13
      };

      const result = emitSNBT(data, { format: 'ftb' });

      // Verify structure
      expect(result).toContain('default_autoclaim_rewards: "disabled"');
      expect(result).toContain('default_consume_items: false');
      expect(result).toContain('detection_delay: 20');
      expect(result).toContain('grid_scale: 0.5');
      expect(result).toContain('version: 13');
      expect(result.startsWith('{')).toBe(true);
      expect(result.endsWith('}')).toBe(true);
    });

    it('emits icon compound structure', () => {
      const data = {
        icon: {
          components: {
            'ftbquests:icon': 'ftbquests:block/barrier_open'
          },
          id: 'ftbquests:custom_icon'
        }
      };

      const result = emitSNBT(data, { format: 'ftb' });

      expect(result).toContain('icon:');
      expect(result).toContain('components:');
      expect(result).toContain('ftbquests:icon');
      expect(result).toContain('ftbquests:custom_icon');
    });
  });

  describe('round-trip compatibility', () => {
    it('defaults to FTB format', () => {
      const data = { key: 'value' };
      const result = emitSNBT(data);
      // Should use FTB format with newlines
      expect(result).toContain('\n');
    });

    it('emits valid structure for re-parsing', () => {
      const data = {
        name: 'test',
        count: 5,
        active: true,
        items: ['a', 'b'],
        nested: {
          deep: 'value'
        }
      };

      const result = emitSNBT(data, { format: 'ftb' });

      // Verify all data is present in output
      expect(result).toContain('name: "test"');
      expect(result).toContain('count: 5');
      expect(result).toContain('active: true');
      expect(result).toContain('"a"');
      expect(result).toContain('"b"');
      expect(result).toContain('deep: "value"');
    });
  });

  describe('edge cases', () => {
    it('handles empty strings', () => {
      expect(emitSNBT('')).toBe('""');
    });

    it('handles zero', () => {
      expect(emitSNBT(0)).toBe('0');
    });

    it('handles negative numbers', () => {
      expect(emitSNBT(-42)).toBe('-42');
      expect(emitSNBT(-1.5)).toBe('-1.5d');
    });

    it('handles scientific notation floats', () => {
      // Should be formatted as decimal, not scientific
      const result = emitSNBT(1e-10);
      expect(result).toBe('0.0000000001d');
    });

    it('handles special characters in strings', () => {
      const result = emitSNBT('!@#$%^&*()');
      expect(result).toBe('"!@#$%^&*()"');
    });

    it('handles Unicode strings', () => {
      const result = emitSNBT('Hello🌍');
      expect(result).toBe('"Hello🌍"');
    });

    it('handles mixed object with all types', () => {
      const data = {
        str: 'text',
        num: 42,
        float: 3.14,
        bool: true,
        null_val: null,
        array: [1, 'two', false],
        nested: { deep: 'value' }
      };

      const result = emitSNBT(data, { format: 'ftb' });

      expect(result).toContain('str: "text"');
      expect(result).toContain('num: 42');
      expect(result).toContain('float: 3.14');
      expect(result).toContain('bool: true');
      expect(result).toContain('null_val: null');
      expect(result).toContain('nested:');
    });
  });

  describe('determinism', () => {
    it('produces identical output for same input', () => {
      const data = { z: 1, a: 2, m: 3, items: [3, 2, 1] };
      const result1 = emitSNBT(data, { format: 'ftb' });
      const result2 = emitSNBT(data, { format: 'ftb' });
      expect(result1).toBe(result2);
    });

    it('produces same output regardless of key insertion order', () => {
      const data1 = { a: 1, b: 2, c: 3 };
      const data2 = { c: 3, a: 1, b: 2 };
      const result1 = emitSNBT(data1, { format: 'ftb' });
      const result2 = emitSNBT(data2, { format: 'ftb' });
      expect(result1).toBe(result2);
    });

    it('handles large nested structures deterministically', () => {
      const data = {
        a: { x: 1, y: 2, z: 3 },
        b: { x: 4, y: 5, z: 6 },
        c: { x: 7, y: 8, z: 9 }
      };
      const result1 = emitSNBT(data, { format: 'ftb' });
      const result2 = emitSNBT(data, { format: 'ftb' });
      expect(result1).toBe(result2);
    });
  });
});
