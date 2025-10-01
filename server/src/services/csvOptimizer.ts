import { CSVRow, OptimizationResult } from '../types';

/**
 * CSV Optimization Service
 * 
 * This service implements a two-pointer meet-in-the-middle solution to the subset sum problem.
 * For each row, it finds the combination of small numbers whose sum is as close as 
 * possible to the big number without exceeding it.
 * 
 * Algorithm: Meet-in-the-middle with two-pointer technique and binary search
 * Time Complexity: O(2^(n/2) * n) where n is the number of small numbers
 * Space Complexity: O(2^(n/2)) - independent of target size
 */
export class CSVOptimizer {
  /**
   * Finds the optimal combination of numbers for a single row
   * @param row - The CSV row containing big number and small numbers
   * @returns OptimizationResult with selected numbers and their sum
   */
  public static optimizeRow(row: CSVRow): OptimizationResult {
    const { bigNumber, smallNumbers } = row;
    
    if (smallNumbers.length === 0) {
      return {
        selectedNumbers: [],
        sum: 0,
        originalRow: row
      };
    }

    // Use dynamic programming to solve the subset sum problem
    const result = this.findOptimalSubset(smallNumbers, bigNumber);
    
    return {
      selectedNumbers: result,
      sum: result.reduce((sum, num) => sum + num, 0),
      originalRow: row
    };
  }

  /**
   * Processes multiple CSV rows and returns optimization results for all
   * @param rows - Array of CSV rows to optimize
   * @returns Array of optimization results
   */
  public static optimizeAllRows(rows: CSVRow[]): OptimizationResult[] {
    return rows.map(row => this.optimizeRow(row));
  }

  /**
   * Two-pointer approach using meet-in-the-middle technique
   * This approach is optimal because:
   * 1. It guarantees finding the best possible solution
   * 2. Better time complexity than brute force: O(2^(n/2) + 2^(n/2) * log(2^(n/2))) = O(2^(n/2) * n)
   * 3. More memory efficient than DP for large targets
   * 4. Handles duplicate numbers correctly
   * 
   * @param numbers - Array of available numbers
   * @param target - Target sum (big number)
   * @returns Array of selected numbers
   */
  private static findOptimalSubset(numbers: number[], target: number): number[] {
    const n = numbers.length;
    
    // Handle edge cases
    if (n === 0) return [];
    if (n === 1) return numbers[0] <= target ? numbers : [];
    
    // Split array into two halves for meet-in-the-middle
    const mid = Math.floor(n / 2);
    const left = numbers.slice(0, mid);
    const right = numbers.slice(mid);
    
    // Generate all possible subset sums for each half
    const leftSums = this.generateAllSubsetSums(left);
    const rightSums = this.generateAllSubsetSums(right);
    
    // Sort right sums for two-pointer technique
    rightSums.sort((a, b) => a.sum - b.sum);
    
    let bestSum = 0;
    let bestCombination: number[] = [];
    
    // For each left sum, find the best right sum using two pointers
    for (const leftSum of leftSums) {
      if (leftSum.sum > target) continue;
      
      const remaining = target - leftSum.sum;
      
      // Use binary search or two-pointer to find best right sum <= remaining
      const bestRightSum = this.findBestSum(rightSums, remaining);
      
      const totalSum = leftSum.sum + bestRightSum.sum;
      
      if (totalSum <= target && totalSum > bestSum) {
        bestSum = totalSum;
        bestCombination = [...leftSum.subset, ...bestRightSum.subset];
      }
    }
    
    return bestCombination.sort((a, b) => a - b);
  }

  /**
   * Generates all possible subset sums for a given array
   * @param numbers - Array of numbers
   * @returns Array of objects containing sum and the subset that creates it
   */
  private static generateAllSubsetSums(numbers: number[]): Array<{sum: number, subset: number[]}> {
    const result: Array<{sum: number, subset: number[]}> = [];
    const n = numbers.length;
    
    // Generate all 2^n subsets using bit manipulation
    for (let mask = 0; mask < (1 << n); mask++) {
      const subset: number[] = [];
      let sum = 0;
      
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          subset.push(numbers[i]);
          sum += numbers[i];
        }
      }
      
      result.push({ sum, subset });
    }
    
    return result;
  }

  /**
   * Finds the best sum <= target using binary search on sorted sums
   * @param sortedSums - Array of sum objects sorted by sum
   * @param target - Target sum to find
   * @returns Best sum object that doesn't exceed target
   */
  private static findBestSum(
    sortedSums: Array<{sum: number, subset: number[]}>, 
    target: number
  ): {sum: number, subset: number[]} {
    if (sortedSums.length === 0) return { sum: 0, subset: [] };
    
    // Binary search for the largest sum <= target
    let left = 0;
    let right = sortedSums.length - 1;
    let bestIndex = 0;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      
      if (sortedSums[mid].sum <= target) {
        bestIndex = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return sortedSums[bestIndex];
  }

  /**
   * Validates a CSV row format
   * @param row - Row to validate
   * @returns boolean indicating if row is valid
   */
  public static validateRow(row: CSVRow): boolean {
    return (
      typeof row.bigNumber === 'number' &&
      row.bigNumber > 0 &&
      Array.isArray(row.smallNumbers) &&
      row.smallNumbers.length <= 12 &&
      row.smallNumbers.every(num => typeof num === 'number' && num > 0)
    );
  }
}

/**
 * Why the two-pointer meet-in-the-middle approach is excellent:
 * 
 * 1. **Optimality**: Guarantees finding the globally optimal solution
 * 2. **Better Time Complexity**: O(2^(n/2) * n) vs O(2^n) brute force, much better for n=12
 * 3. **Memory Efficiency**: Independent of target size, only depends on number of elements
 * 4. **Scalability**: Excellent for the 12 small numbers constraint (2^6 = 64 combinations per half)
 * 
 * Advantages over Dynamic Programming:
 * - No dependency on target size for memory usage
 * - Better time complexity for moderate n (up to ~20)
 * - Uses two-pointer technique with binary search for efficiency
 * - Still handles duplicate numbers and edge cases correctly
 * 
 * Technical Details:
 * - Splits problem into two halves: O(2^(n/2)) each
 * - Sorts one half: O(2^(n/2) * log(2^(n/2))) = O(2^(n/2) * n/2)
 * - Binary search for each combination: O(2^(n/2) * log(2^(n/2)))
 * - Total: O(2^(n/2) * n) which is much better than O(2^n) for n=12
 * 
 * Limitations:
 * - Still exponential, but with much better constant factor
 * - More complex implementation than simple DP
 * - Not suitable for very large n (> 30), but perfect for our constraint of 12
 */
