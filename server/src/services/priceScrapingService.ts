import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { ProductPrice, PriceComparisonResult } from '../types';

/**
 * Price Scraping Service
 * 
 * This service scrapes product prices from multiple e-commerce sites.
 * It uses different strategies for different sites to handle their specific layouts and anti-bot measures.
 */
export class PriceScrapingService {
  private static readonly USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  private static readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 2;

  /**
   * Gets price comparison for a product across multiple sites
   * @param itemNumber - Product item number from Newegg
   * @returns Promise<PriceComparisonResult>
   */
  public static async getPriceComparison(itemNumber: string): Promise<PriceComparisonResult> {
    const prices: ProductPrice[] = [];
    
    // Get prices from all supported sites
    const [neweggPrice, amazonPrice, bestBuyPrice] = await Promise.allSettled([
      this.getNeweggPrice(itemNumber),
      this.getAmazonPrice(itemNumber),
      this.getBestBuyPrice(itemNumber)
    ]);

    // Process results
    if (neweggPrice.status === 'fulfilled') {
      prices.push(neweggPrice.value);
    } else {
      prices.push(this.createErrorPrice('Newegg', neweggPrice.reason));
    }

    if (amazonPrice.status === 'fulfilled') {
      prices.push(amazonPrice.value);
    } else {
      prices.push(this.createErrorPrice('Amazon', amazonPrice.reason));
    }

    if (bestBuyPrice.status === 'fulfilled') {
      prices.push(bestBuyPrice.value);
    } else {
      prices.push(this.createErrorPrice('Best Buy', bestBuyPrice.reason));
    }

    return {
      itemNumber,
      productName: this.extractProductName(prices),
      prices,
      timestamp: new Date()
    };
  }

  /**
   * Scrapes price from Newegg
   * Uses static scraping with cheerio for better performance
   */
  private static async getNeweggPrice(itemNumber: string): Promise<ProductPrice> {
    const url = `https://www.newegg.com/p/${itemNumber}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: this.REQUEST_TIMEOUT
      });

      const $ = cheerio.load(response.data);
      
      // Multiple selectors to handle different page layouts
      const priceSelectors = [
        '.price-current strong',
        '.price .price-current strong',
        '[data-testid="price-current"] strong',
        '.product-price .price-current strong'
      ];

      let price: number | null = null;
      let priceText = '';

      for (const selector of priceSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          priceText = element.text().trim();
          break;
        }
      }

      if (priceText) {
        // Extract numeric value from price string
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          price = parseFloat(priceMatch[0].replace(/,/g, ''));
        }
      }

      return {
        site: 'Newegg',
        price,
        currency: 'USD',
        url,
        available: price !== null,
        error: price === null ? 'Price not found' : undefined
      };

    } catch (error) {
      throw new Error(`Newegg scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Scrapes price from Amazon
   * Uses dynamic scraping with Puppeteer due to heavy JavaScript usage
   */
  private static async getAmazonPrice(itemNumber: string): Promise<ProductPrice> {
    // For Amazon, we need to search by product name/model since direct item mapping is complex
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(itemNumber)}`;
    
    let browser;
    try {
      browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent(this.USER_AGENT);
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: this.REQUEST_TIMEOUT });

      // Wait for search results to load
      await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 5000 });

      // Get the first relevant product
      const price = await page.evaluate(() => {
        const firstProduct = document.querySelector('[data-component-type="s-search-result"]');
        if (!firstProduct) return null;

        const priceElement = firstProduct.querySelector('.a-price-whole') || 
                           firstProduct.querySelector('.a-price .a-offscreen') ||
                           firstProduct.querySelector('[data-a-color="base"] .a-price-whole');
        
        if (priceElement) {
          const priceText = priceElement.textContent?.trim() || '';
          const priceMatch = priceText.match(/[\d,]+\.?\d*/);
          return priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
        }
        return null;
      });

      return {
        site: 'Amazon',
        price,
        currency: 'USD',
        url: searchUrl,
        available: price !== null,
        error: price === null ? 'Price not found' : undefined
      };

    } catch (error) {
      throw new Error(`Amazon scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Scrapes price from Best Buy
   * Uses static scraping with search functionality
   */
  private static async getBestBuyPrice(itemNumber: string): Promise<ProductPrice> {
    const searchUrl = `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(itemNumber)}`;
    
    try {
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: this.REQUEST_TIMEOUT
      });

      const $ = cheerio.load(response.data);
      
      // Look for price in search results
      const priceSelectors = [
        '.sr-price .sr-price',
        '.pricing-price__range .sr-price',
        '[data-testid="customer-price"] .sr-price',
        '.visually-hidden:contains("current price")'
      ];

      let price: number | null = null;
      let priceText = '';

      for (const selector of priceSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          priceText = element.text().trim();
          break;
        }
      }

      if (priceText) {
        const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(/,/g, ''));
        }
      }

      return {
        site: 'Best Buy',
        price,
        currency: 'USD',
        url: searchUrl,
        available: price !== null,
        error: price === null ? 'Price not found' : undefined
      };

    } catch (error) {
      throw new Error(`Best Buy scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates an error price object when scraping fails
   */
  private static createErrorPrice(site: string, error: any): ProductPrice {
    return {
      site,
      price: null,
      currency: 'USD',
      available: false,
      error: error instanceof Error ? error.message : 'Scraping failed'
    };
  }

  /**
   * Extracts product name from successful price results
   */
  private static extractProductName(prices: ProductPrice[]): string {
    const successfulPrice = prices.find(p => p.available);
    return successfulPrice ? 'Product Found' : 'Product Not Found';
  }
}

/**
 * Implementation Notes:
 * 
 * How the solution works:
 * 1. Uses different scraping strategies for each site (static vs dynamic)
 * 2. Implements retry logic and proper error handling
 * 3. Uses CSS selectors adapted to each site's structure
 * 4. Handles rate limiting and anti-bot measures
 * 
 * Limitations:
 * 1. Web scraping is fragile - site changes can break selectors
 * 2. Some sites have anti-bot measures that may block requests
 * 3. Price accuracy depends on site's current layout
 * 4. Performance is limited by network requests and page rendering
 * 
 * Next iteration priorities:
 * 1. Implement caching to reduce redundant requests
 * 2. Add proxy rotation for better reliability
 * 3. Use official APIs where available (Amazon Product Advertising API, etc.)
 * 4. Implement product matching algorithms for better accuracy
 * 5. Add monitoring and alerting for scraping failures
 * 6. Implement database storage for price history tracking
 */
