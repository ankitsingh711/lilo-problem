import { Router, Request, Response } from 'express';
import { PriceScrapingService } from '../services/priceScrapingService';
import { APIResponse, PriceComparisonResult, PriceComparisonRequest } from '../types';

const router = Router();

/**
 * POST /api/price/compare
 * Compare prices across multiple e-commerce sites
 */
router.post('/compare', async (
  req: Request<{}, APIResponse<PriceComparisonResult>, PriceComparisonRequest>,
  res: Response<APIResponse<PriceComparisonResult>>
) => {
  try {
    const { itemNumber, productName } = req.body;

    if (!itemNumber || typeof itemNumber !== 'string' || itemNumber.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Item number is required and must be a non-empty string'
      });
    }

    // Clean and validate item number
    const cleanItemNumber = itemNumber.trim();
    
    // Basic validation for Newegg item number format (usually alphanumeric with hyphens)
    if (!/^[A-Za-z0-9\-_]+$/.test(cleanItemNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid item number format'
      });
    }

    console.log(`Starting price comparison for item: ${cleanItemNumber}`);

    // Get price comparison
    const result = await PriceScrapingService.getPriceComparison(cleanItemNumber);

    // Check if we got at least one successful price
    const successfulPrices = result.prices.filter(p => p.available);
    
    if (successfulPrices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found on any supported sites',
        data: result
      });
    }

    return res.json({
      success: true,
      data: result,
      message: `Found prices on ${successfulPrices.length} out of ${result.prices.length} sites`
    });

  } catch (error) {
    console.error('Price comparison error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/price/compare/:itemNumber
 * Compare prices using GET request (alternative endpoint)
 */
router.get('/compare/:itemNumber', async (
  req: Request,
  res: Response<APIResponse<PriceComparisonResult>>
) => {
  try {
    const { itemNumber } = req.params;

    if (!itemNumber || itemNumber.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Item number is required'
      });
    }

    const cleanItemNumber = itemNumber.trim();
    
    if (!/^[A-Za-z0-9\-_]+$/.test(cleanItemNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid item number format'
      });
    }

    console.log(`Starting price comparison for item: ${cleanItemNumber}`);

    const result = await PriceScrapingService.getPriceComparison(cleanItemNumber);
    const successfulPrices = result.prices.filter(p => p.available);
    
    if (successfulPrices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found on any supported sites',
        data: result
      });
    }

    return res.json({
      success: true,
      data: result,
      message: `Found prices on ${successfulPrices.length} out of ${result.prices.length} sites`
    });

  } catch (error) {
    console.error('Price comparison error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/price/health
 * Health check endpoint for price service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Price comparison service is running',
    timestamp: new Date().toISOString(),
    supportedSites: ['Newegg', 'Amazon', 'Best Buy']
  });
});

export default router;
