import { CSVOptimizer } from '../csvOptimizer';
import { CSVRow } from '../../types';

describe('CSVOptimizer', () => {
  describe('optimizeRow', () => {
    it('should find optimal subset for simple case', () => {
      const row: CSVRow = {
        bigNumber: 10,
        smallNumbers: [1, 2, 3, 4, 5, 6]
      };

      const result = CSVOptimizer.optimizeRow(row);

      expect(result.sum).toBeLessThanOrEqual(10);
      expect(result.sum).toBeGreaterThan(0);
      // Should find optimal sum of 10 (could be [1,3,6] or [4,6] or [1,2,3,4])
      expect(result.sum).toBe(10);
      expect(result.selectedNumbers.reduce((sum, num) => sum + num, 0)).toBe(10);
      // Verify all selected numbers are from the original array
      result.selectedNumbers.forEach(num => {
        expect(row.smallNumbers).toContain(num);
      });
    });

    it('should handle case where no numbers fit', () => {
      const row: CSVRow = {
        bigNumber: 5,
        smallNumbers: [10, 15, 20]
      };

      const result = CSVOptimizer.optimizeRow(row);

      expect(result.sum).toBe(0);
      expect(result.selectedNumbers).toEqual([]);
    });

    it('should handle exact match', () => {
      const row: CSVRow = {
        bigNumber: 15,
        smallNumbers: [5, 10, 3, 7]
      };

      const result = CSVOptimizer.optimizeRow(row);

      expect(result.sum).toBe(15);
      expect(result.selectedNumbers.reduce((sum, num) => sum + num, 0)).toBe(15);
    });

    it('should handle duplicate numbers', () => {
      const row: CSVRow = {
        bigNumber: 10,
        smallNumbers: [3, 3, 4, 4, 5]
      };

      const result = CSVOptimizer.optimizeRow(row);

      expect(result.sum).toBeLessThanOrEqual(10);
      expect(result.sum).toBeGreaterThan(0);
    });

    it('should handle empty small numbers array', () => {
      const row: CSVRow = {
        bigNumber: 10,
        smallNumbers: []
      };

      const result = CSVOptimizer.optimizeRow(row);

      expect(result.sum).toBe(0);
      expect(result.selectedNumbers).toEqual([]);
    });
  });

  describe('validateRow', () => {
    it('should validate correct row format', () => {
      const row: CSVRow = {
        bigNumber: 10,
        smallNumbers: [1, 2, 3]
      };

      expect(CSVOptimizer.validateRow(row)).toBe(true);
    });

    it('should reject negative big number', () => {
      const row: CSVRow = {
        bigNumber: -5,
        smallNumbers: [1, 2, 3]
      };

      expect(CSVOptimizer.validateRow(row)).toBe(false);
    });

    it('should reject too many small numbers', () => {
      const row: CSVRow = {
        bigNumber: 10,
        smallNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] // 13 numbers > 12 limit
      };

      expect(CSVOptimizer.validateRow(row)).toBe(false);
    });

    it('should reject negative small numbers', () => {
      const row: CSVRow = {
        bigNumber: 10,
        smallNumbers: [1, -2, 3]
      };

      expect(CSVOptimizer.validateRow(row)).toBe(false);
    });
  });

  describe('optimizeAllRows', () => {
    it('should optimize multiple rows', () => {
      const rows: CSVRow[] = [
        { bigNumber: 10, smallNumbers: [1, 2, 3, 4, 5] },
        { bigNumber: 20, smallNumbers: [5, 10, 15, 8, 12] }
      ];

      const results = CSVOptimizer.optimizeAllRows(rows);

      expect(results).toHaveLength(2);
      expect(results[0].sum).toBeLessThanOrEqual(10);
      expect(results[1].sum).toBeLessThanOrEqual(20);
      expect(results[0].originalRow).toEqual(rows[0]);
      expect(results[1].originalRow).toEqual(rows[1]);
    });
  });
});
