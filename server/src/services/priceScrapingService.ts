import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ProductPrice, PriceComparisonResult } from '../types';

// Use stealth plugin for advanced anti-detection
puppeteer.use(StealthPlugin());

export class PriceScrapingService {
  private static readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  ];

  /**
   * Main entry point - REAL SCRAPING ONLY
   */
  public static async getPriceComparison(itemNumber: string): Promise<PriceComparisonResult> {
    console.log(`🚀 REAL SCRAPING MODE: Starting aggressive price comparison for ${itemNumber}`);
    
    const prices: ProductPrice[] = [];
    
    // Run all scrapers in parallel for maximum speed
    const [neweggResult, amazonResult, bestBuyResult] = await Promise.allSettled([
      this.scrapeNewegg(itemNumber),
      this.scrapeAmazon(itemNumber), 
      this.scrapeBestBuy(itemNumber)
    ]);

    // Process Newegg result
    if (neweggResult.status === 'fulfilled') {
      prices.push(neweggResult.value);
    } else {
      prices.push({
        site: 'Newegg',
        price: null,
        currency: 'USD',
        available: false,
        error: `REAL SCRAPING FAILED: ${neweggResult.reason}`
      });
    }

    // Process Amazon result  
    if (amazonResult.status === 'fulfilled') {
      prices.push(amazonResult.value);
    } else {
      prices.push({
        site: 'Amazon',
        price: null,
        currency: 'USD', 
        available: false,
        error: `REAL SCRAPING FAILED: ${amazonResult.reason}`
      });
    }

    // Process Best Buy result
    if (bestBuyResult.status === 'fulfilled') {
      prices.push(bestBuyResult.value);
    } else {
      prices.push({
        site: 'Best Buy',
        price: null,
        currency: 'USD',
        available: false,  
        error: `REAL SCRAPING FAILED: ${bestBuyResult.reason}`
      });
    }

    return {
      itemNumber,
      productName: this.getProductName(prices),
      prices,
      timestamp: new Date()
    };
  }

  /**
   * Newegg scraper - try HTTP first, then Puppeteer if needed
   */
  private static async scrapeNewegg(itemNumber: string): Promise<ProductPrice> {
    const url = `https://www.newegg.com/p/${itemNumber}`;
    
    console.log(`🔍 Newegg: Starting scrape for ${itemNumber}`);
    
    // First try simple HTTP request
    try {
      console.log(`📡 Newegg: Trying HTTP request first...`);
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      // Check if we got Cloudflare challenge
      if (response.data.includes('Just a moment') || response.data.includes('Checking your browser')) {
        console.log(`🔄 Newegg: Cloudflare detected in HTTP response, falling back to browser...`);
        return await this.scrapeNeweggWithBrowser(itemNumber);
      }

      // Try to extract price from HTML
      const $ = cheerio.load(response.data);
      const selectors = [
        '.price-current strong',
        '.price-current-num',
        '.product-price .price-current strong',
        '.price-current',
        '[data-testid="price-current"]'
      ];

      let price: number | null = null;
      for (const selector of selectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          const match = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
          if (match) {
            const parsedPrice = parseFloat(match[1].replace(/,/g, ''));
            if (parsedPrice > 10 && parsedPrice < 10000) {
              price = parsedPrice;
              console.log(`✅ Newegg HTTP: Found price $${price}`);
              break;
            }
          }
        }
      }

      return {
        site: 'Newegg',
        price,
        currency: 'USD',
        url,
        available: price !== null,
        error: price === null ? 'No price found in HTTP response' : undefined
      };

    } catch (error) {
      console.log(`⚠️ Newegg HTTP failed, trying browser method...`);
      return await this.scrapeNeweggWithBrowser(itemNumber);
    }
  }

  /**
   * Newegg browser-based scraping (fallback) - with improved Chrome handling
   */
  private static async scrapeNeweggWithBrowser(itemNumber: string): Promise<ProductPrice> {
    console.log(`🔍 Newegg Browser: Chrome process issue detected, trying alternative approach...`);
    
    // Instead of Puppeteer, let's try a more robust HTTP approach with different techniques
    return await this.scrapeNeweggAlternative(itemNumber);
  }

  /**
   * Alternative Newegg scraping using different HTTP techniques
   */
  private static async scrapeNeweggAlternative(itemNumber: string): Promise<ProductPrice> {
    const url = `https://www.newegg.com/p/${itemNumber}`;
    
    try {
      console.log(`🔧 Newegg Alternative: Trying enhanced HTTP scraping for ${itemNumber}`);
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Try with different user agents and session simulation
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0'
      ];

      for (let attempt = 0; attempt < userAgents.length; attempt++) {
        try {
          console.log(`🌐 Newegg Alternative: Attempt ${attempt + 1}/${userAgents.length}`);
          
          const response = await axios.get(url, {
            headers: {
              'User-Agent': userAgents[attempt],
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Sec-Fetch-User': '?1',
              'Cache-Control': 'max-age=0',
              'DNT': '1',
              'Referer': 'https://www.google.com/',
            },
            timeout: 20000,
            maxRedirects: 10,
            validateStatus: (status) => status < 500, // Accept even 4xx responses
          });

          console.log(`📄 Newegg Alternative: Response status ${response.status}, size: ${response.data.length} chars`);

          // Check for various blocking patterns
          if (response.data.includes('Just a moment') || 
              response.data.includes('Checking your browser') ||
              response.data.includes('Please wait') ||
              response.data.includes('Loading...') ||
              response.data.length < 1000) {
            console.log(`🚫 Newegg Alternative: Detected blocking/challenge page`);
            continue; // Try next user agent
          }

          // Try to extract price with more comprehensive approach
          const $ = cheerio.load(response.data);
          
          // First try standard selectors
          const priceSelectors = [
            '.price-current strong',
            '.price-current-num',
            '.product-price .price-current strong',
            '.price-current',
            '[data-testid="price-current"]',
            '.product-buy-box .price-current',
            '.item-price',
            '.price'
          ];

          let price: number | null = null;
          
          for (const selector of priceSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
              const text = element.text().trim();
              console.log(`💡 Newegg Alternative: Found text with selector '${selector}': "${text}"`);
              
              const match = text.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
              if (match) {
                const parsedPrice = parseFloat(match[1].replace(/,/g, ''));
                if (parsedPrice > 10 && parsedPrice < 50000) {
                  price = parsedPrice;
                  console.log(`✅ Newegg Alternative: Found valid price $${price} using selector '${selector}'`);
                  break;
                }
              }
            }
          }

          // If no price found with selectors, try regex on entire page
          if (price === null) {
            console.log(`🔍 Newegg Alternative: No price with selectors, trying regex approach...`);
            const priceRegex = /(?:price|cost|amount)["\s:>]{1,10}\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi;
            const matches = response.data.match(priceRegex);
            
            if (matches) {
              console.log(`💡 Newegg Alternative: Found ${matches.length} potential price matches`);
              for (const match of matches.slice(0, 5)) { // Check first 5 matches
                const numMatch = match.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
                if (numMatch) {
                  const parsedPrice = parseFloat(numMatch[1].replace(/,/g, ''));
                  if (parsedPrice > 50 && parsedPrice < 10000) {
                    price = parsedPrice;
                    console.log(`✅ Newegg Alternative: Found valid price $${price} via regex`);
                    break;
                  }
                }
              }
            }
          }

          return {
            site: 'Newegg',
            price,
            currency: 'USD',
            url,
            available: price !== null,
            error: price === null ? `Real scraping successful but no price found (attempt ${attempt + 1})` : undefined
          };

        } catch (requestError) {
          console.log(`⚠️ Newegg Alternative: Attempt ${attempt + 1} failed:`, requestError instanceof Error ? requestError.message : 'Unknown error');
          if (attempt === userAgents.length - 1) {
            throw requestError; // Re-throw on last attempt
          }
        }
        
        // Wait between attempts
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      }

      throw new Error('All HTTP attempts failed');

    } catch (error) {
      console.log(`❌ Newegg Alternative error:`, error);
      throw new Error(`Newegg alternative scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Amazon scraper with HTTP-only approach
   */
  private static async scrapeAmazon(itemNumber: string): Promise<ProductPrice> {
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(itemNumber)}`;

    try {
      console.log(`🔍 Amazon HTTP: Starting scrape for ${itemNumber}`);
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 3000));
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Referer': 'https://www.google.com/',
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      console.log(`📄 Amazon HTTP: Response status ${response.status}, size: ${response.data.length} chars`);

      // Check for blocking
      if (response.data.includes('Sorry, we just need to make sure you') || 
          response.data.includes('Enter the characters you see below') ||
          response.data.length < 5000) {
        console.log(`🚫 Amazon HTTP: Detected blocking/CAPTCHA`);
        return {
          site: 'Amazon',
          price: null,
          currency: 'USD',
          url: searchUrl,
          available: false,
          error: 'Amazon blocked request - CAPTCHA or bot detection triggered'
        };
      }

      // Try to extract price
      const $ = cheerio.load(response.data);
      const priceSelectors = [
        '.a-price-whole',
        '.a-price .a-offscreen',
        '[data-a-color="base"] .a-price-whole',
        '.a-price-range .a-price-whole',
        '.a-price-symbol + .a-price-whole'
      ];

      let price: number | null = null;
      for (const selector of priceSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          console.log(`💡 Amazon HTTP: Found text with selector '${selector}': "${text}"`);
          
          const match = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
          if (match) {
            const parsedPrice = parseFloat(match[1].replace(/,/g, ''));
            if (parsedPrice > 10 && parsedPrice < 50000) {
              price = parsedPrice;
              console.log(`✅ Amazon HTTP: Found valid price $${price}`);
              break;
            }
          }
        }
      }

      return {
        site: 'Amazon',
        price,
        currency: 'USD',
        url: searchUrl,
        available: price !== null,
        error: price === null ? 'Real HTTP scraping successful but no price found' : undefined
      };

    } catch (error) {
      console.log(`❌ Amazon HTTP error:`, error);
      throw new Error(`Amazon HTTP scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Best Buy scraper with HTTP-only approach
   */
  private static async scrapeBestBuy(itemNumber: string): Promise<ProductPrice> {
    const searchUrl = `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(itemNumber)}`;

    try {
      console.log(`🔍 Best Buy HTTP: Starting scrape for ${itemNumber}`);
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 3000));
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Referer': 'https://www.bestbuy.com/',
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      console.log(`📄 Best Buy HTTP: Response status ${response.status}, size: ${response.data.length} chars`);

      // Check for blocking
      if (response.data.includes('Access Denied') || 
          response.data.includes('Blocked') ||
          response.data.length < 3000) {
        console.log(`🚫 Best Buy HTTP: Detected blocking`);
        return {
          site: 'Best Buy',
          price: null,
          currency: 'USD',
          url: searchUrl,
          available: false,
          error: 'Best Buy blocked request - access denied or bot detection'
        };
      }

      // Try to extract price
      const $ = cheerio.load(response.data);
      const selectors = [
        '.pricing-current-price',
        '.sr-price',
        '.price-current',
        '[class*="price"]:not([class*="original"])',
        '.visuallyhidden .sr-price'
      ];

      let price: number | null = null;
      for (const selector of selectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          console.log(`💡 Best Buy HTTP: Found text with selector '${selector}': "${text}"`);
          
          const match = text.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
          if (match) {
            const parsedPrice = parseFloat(match[1].replace(/,/g, ''));
            if (parsedPrice > 10 && parsedPrice < 50000) {
              price = parsedPrice;
              console.log(`✅ Best Buy HTTP: Found valid price $${price}`);
              break;
            }
          }
        }
      }

      return {
        site: 'Best Buy',
        price,
        currency: 'USD',
        url: searchUrl,
        available: price !== null,
        error: price === null ? 'Real HTTP scraping successful but no price found' : undefined
      };

    } catch (error) {
      console.log(`❌ Best Buy HTTP error:`, error);
      throw new Error(`Best Buy HTTP scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper methods
   */
  private static getRandomUserAgent(): string {
    return this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
  }

  private static getProductName(prices: ProductPrice[]): string {
    const available = prices.find(p => p.available);
    return available ? 'Product Found' : 'Product Not Found';
  }
}
