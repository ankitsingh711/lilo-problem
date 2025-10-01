import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
  Link,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  OpenInNew as OpenIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { priceApi } from '../services/api';
import { PriceComparisonResult, ProductPrice } from '../types';

const PriceComparison: React.FC = () => {
  const [itemNumber, setItemNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!itemNumber.trim()) {
      setError('Please enter a Newegg item number');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const comparisonResult = await priceApi.comparePrices({
        itemNumber: itemNumber.trim()
      });
      setResult(comparisonResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare prices');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getPriceChipColor = (price: ProductPrice, allPrices: ProductPrice[]) => {
    if (!price.available || price.price === null) return 'error';
    
    const availablePrices = allPrices.filter(p => p.available && p.price !== null);
    if (availablePrices.length === 0) return 'default';
    
    const prices = availablePrices.map(p => p.price!);
    const minPrice = Math.min(...prices);
    
    return price.price === minPrice ? 'success' : 'default';
  };

  const getLowestPrice = (prices: ProductPrice[]) => {
    const availablePrices = prices.filter(p => p.available && p.price !== null);
    if (availablePrices.length === 0) return null;
    
    return availablePrices.reduce((min, current) => 
      (current.price! < min.price!) ? current : min
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Question #2: Price Comparison Tool
      </Typography>
      
      <Typography variant="body1" paragraph color="text.secondary">
        Enter a Newegg item number to compare prices across multiple e-commerce sites including 
        Newegg, Amazon, and Best Buy. The tool will scrape current prices and show you the best deals.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search Product
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              fullWidth
              label="Newegg Item Number"
              placeholder="e.g., N82E16834725142"
              value={itemNumber}
              onChange={(e) => setItemNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              helperText="Enter the item number from a Newegg product URL"
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading || !itemNumber.trim()}
              sx={{ minWidth: 120 }}
            >
              Compare
            </Button>
          </Box>

          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              <strong>Example:</strong> From URL https://www.newegg.com/p/N82E16834725142, 
              use item number: N82E16834725142
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            Searching across multiple e-commerce sites...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Price Comparison Results
            </Typography>
            <Tooltip title="Refresh prices">
              <IconButton onClick={handleSearch} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Item Number: <strong>{result.itemNumber}</strong> | 
            Last Updated: {new Date(result.timestamp).toLocaleString()}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {result.prices.map((price) => (
              <Grid item xs={12} md={4} key={price.site}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    height: '100%',
                    border: price.available && price.price === getLowestPrice(result.prices)?.price 
                      ? '2px solid green' 
                      : undefined
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="h6">
                        {price.site}
                      </Typography>
                      {price.available ? (
                        <SuccessIcon color="success" fontSize="small" />
                      ) : (
                        <ErrorIcon color="error" fontSize="small" />
                      )}
                    </Box>
                    
                    <Typography variant="h4" color={price.available ? 'text.primary' : 'text.secondary'}>
                      {formatPrice(price.price, price.currency)}
                    </Typography>
                    
                    {price.available && price.url && (
                      <Box mt={1}>
                        <Link 
                          href={price.url} 
                          target="_blank" 
                          rel="noopener"
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          View Product <OpenIcon fontSize="small" />
                        </Link>
                      </Box>
                    )}
                    
                    {price.error && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        {price.error}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Detailed Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Site</strong></TableCell>
                  <TableCell><strong>Price</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Link</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.prices.map((price) => (
                  <TableRow key={price.site}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {price.site}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatPrice(price.price, price.currency)}
                        color={getPriceChipColor(price, result.prices)}
                        variant={price.available ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={price.available ? 'Available' : 'Not Found'}
                        color={price.available ? 'success' : 'error'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {price.url ? (
                        <Link 
                          href={price.url} 
                          target="_blank" 
                          rel="noopener"
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          View <OpenIcon fontSize="small" />
                        </Link>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Best Deal Highlight */}
          {(() => {
            const lowestPrice = getLowestPrice(result.prices);
            if (lowestPrice) {
              return (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <strong>Best Deal:</strong> {lowestPrice.site} - {formatPrice(lowestPrice.price, lowestPrice.currency)}
                </Alert>
              );
            }
            return null;
          })()}

          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Implementation Details
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>How it works:</strong> The system uses different scraping strategies for each site:
            </Typography>
            <ul>
              <li><strong>Newegg:</strong> Direct item lookup using static HTML parsing</li>
              <li><strong>Amazon:</strong> Search-based lookup using dynamic rendering (Puppeteer)</li>
              <li><strong>Best Buy:</strong> Search-based lookup using static HTML parsing</li>
            </ul>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Limitations:</strong>
            </Typography>
            <ul>
              <li>Web scraping is fragile - site changes can break selectors</li>
              <li>Some sites have anti-bot measures that may block requests</li>
              <li>Price accuracy depends on current site layout</li>
              <li>Performance is limited by network requests</li>
            </ul>
            <Typography variant="body2" color="text.secondary">
              <strong>Next iteration priorities:</strong> Implement caching, use official APIs where available, 
              add proxy rotation, implement product matching algorithms, and add price history tracking.
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default PriceComparison;
