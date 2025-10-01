import { Router, Request, Response } from 'express';
import multer from 'multer';
import { CSVParser } from '../utils/csvParser';
import { CSVOptimizer } from '../services/csvOptimizer';
import { APIResponse, OptimizationResult } from '../types';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * POST /api/csv/optimize
 * Upload and optimize CSV file
 */
router.post('/optimize', upload.single('csvFile'), async (
  req: Request,
  res: Response<APIResponse<OptimizationResult[]>>
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No CSV file uploaded'
      });
      return;
    }

    // Parse CSV file
    const rows = await CSVParser.parseCSV(req.file.buffer);
    
    // Validate CSV content
    const validation = CSVParser.validateCSV(rows);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid CSV format',
        message: validation.errors.join('; ')
      });
      return;
    }

    // Optimize all rows
    const results = CSVOptimizer.optimizeAllRows(rows);

    res.json({
      success: true,
      data: results,
      message: `Successfully optimized ${results.length} rows`
    });

  } catch (error) {
    console.error('CSV optimization error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/csv/optimize-data
 * Optimize CSV data sent as JSON
 */
router.post('/optimize-data', async (
  req: Request,
  res: Response<APIResponse<OptimizationResult[]>>
): Promise<void> => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows)) {
      res.status(400).json({
        success: false,
        error: 'Invalid input: rows must be an array'
      });
      return;
    }

    // Validate each row
    const validatedRows = rows.map((row, index) => {
      if (!CSVOptimizer.validateRow(row)) {
        throw new Error(`Invalid row ${index + 1}: must have bigNumber and smallNumbers array`);
      }
      return row;
    });

    // Optimize all rows
    const results = CSVOptimizer.optimizeAllRows(validatedRows);

    res.json({
      success: true,
      data: results,
      message: `Successfully optimized ${results.length} rows`
    });

  } catch (error) {
    console.error('CSV data optimization error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
