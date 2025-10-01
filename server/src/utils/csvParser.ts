import csv from 'csv-parser';
import { Readable } from 'stream';
import { CSVRow } from '../types';

/**
 * CSV Parser Utility
 * 
 * Handles parsing of CSV files with the specific format required:
 * - First column: big number
 * - Remaining columns: small numbers (up to 12)
 */
export class CSVParser {
  /**
   * Parses CSV buffer into structured data
   * @param buffer - CSV file buffer
   * @returns Promise<CSVRow[]>
   */
  public static async parseCSV(buffer: Buffer): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
      const results: CSVRow[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(csv({ headers: false }))
        .on('data', (data) => {
          try {
            const row = this.parseRow(data);
            if (row) {
              results.push(row);
            }
          } catch (error) {
            console.warn('Skipping invalid row:', data, error);
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Parses a single CSV row
   * @param data - Raw CSV row data
   * @returns CSVRow or null if invalid
   */
  private static parseRow(data: any): CSVRow | null {
    const values = Object.values(data) as string[];
    
    // Filter out empty values and convert to numbers
    const numbers = values
      .filter(val => val && val.trim() !== '')
      .map(val => {
        const num = parseFloat(val.trim());
        if (isNaN(num) || num <= 0) {
          throw new Error(`Invalid number: ${val}`);
        }
        return num;
      });

    if (numbers.length < 1) {
      return null; // Skip empty rows
    }

    const [bigNumber, ...smallNumbers] = numbers;

    // Validate constraints
    if (smallNumbers.length > 12) {
      throw new Error(`Too many small numbers: ${smallNumbers.length} (max: 12)`);
    }

    return {
      bigNumber,
      smallNumbers
    };
  }

  /**
   * Validates CSV format
   * @param rows - Parsed CSV rows
   * @returns validation result
   */
  public static validateCSV(rows: CSVRow[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (rows.length === 0) {
      errors.push('CSV file is empty');
    }

    rows.forEach((row, index) => {
      if (row.bigNumber <= 0) {
        errors.push(`Row ${index + 1}: Big number must be positive`);
      }

      if (row.smallNumbers.some(num => num <= 0)) {
        errors.push(`Row ${index + 1}: All small numbers must be positive`);
      }

      if (row.smallNumbers.length > 12) {
        errors.push(`Row ${index + 1}: Too many small numbers (max: 12)`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
