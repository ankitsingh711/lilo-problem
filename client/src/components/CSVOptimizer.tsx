import React, { useState, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
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
  Divider,
  TextField,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Calculate as CalculateIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { styled } from '@mui/material/styles';
import { csvApi } from '../services/api';
import { OptimizationResult, CSVRow } from '../types';

const DropzoneContainer = styled(Box)<{ isDragActive: boolean }>(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: isDragActive ? theme.palette.action.hover : 'transparent',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const CSVOptimizer: React.FC = () => {
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const optimizationResults = await csvApi.optimizeCSV(file);
      setResults(optimizationResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV file');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: loading,
  });

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      setError('Please enter CSV data');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Parse manual input
      const lines = manualInput.trim().split('\n');
      const rows: CSVRow[] = lines.map((line, index) => {
        const values = line.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
        if (values.length < 1) {
          throw new Error(`Invalid data in line ${index + 1}`);
        }
        const [bigNumber, ...smallNumbers] = values;
        return { bigNumber, smallNumbers };
      });

      const optimizationResults = await csvApi.optimizeCSVData(rows);
      setResults(optimizationResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process CSV data');
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    const csvContent = [
      'Big Number,Small Numbers,Selected Numbers,Sum,Efficiency',
      ...results.map(result => {
        const efficiency = ((result.sum / result.originalRow.bigNumber) * 100).toFixed(1);
        return [
          result.originalRow.bigNumber,
          `"[${result.originalRow.smallNumbers.join(', ')}]"`,
          `"[${result.selectedNumbers.join(', ')}]"`,
          result.sum,
          `${efficiency}%`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimization_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Question #1: CSV Number Optimization
      </Typography>
      
      <Typography variant="body1" paragraph color="text.secondary">
        Upload a CSV file where each row contains a "big number" followed by up to 12 "small numbers". 
        The algorithm will find the combination of small numbers that sum closest to the big number without exceeding it.
      </Typography>

      <Grid container spacing={3}>
        {/* File Upload Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload CSV File
              </Typography>
              <DropzoneContainer {...getRootProps()} isDragActive={isDragActive}>
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Drop the CSV file here' : 'Drag & drop a CSV file here'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or click to select a file
                </Typography>
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  disabled={loading}
                >
                  Choose File
                </Button>
              </DropzoneContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Manual Input Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Manual Input
              </Typography>
              <TextField
                multiline
                rows={8}
                fullWidth
                placeholder="Enter CSV data (one row per line):&#10;10,1,2,3,4,5&#10;20,5,10,15,8,12"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                startIcon={<CalculateIcon />}
                onClick={handleManualSubmit}
                disabled={loading || !manualInput.trim()}
                fullWidth
              >
                Process Data
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ mt: 3 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            Processing CSV data...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {results.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Optimization Results ({results.length} rows)
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadResults}
            >
              Download Results
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Row</strong></TableCell>
                  <TableCell><strong>Big Number</strong></TableCell>
                  <TableCell><strong>Available Numbers</strong></TableCell>
                  <TableCell><strong>Selected Numbers</strong></TableCell>
                  <TableCell><strong>Sum</strong></TableCell>
                  <TableCell><strong>Efficiency</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result, index) => {
                  const efficiency = ((result.sum / result.originalRow.bigNumber) * 100).toFixed(1);
                  return (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Chip 
                          label={result.originalRow.bigNumber} 
                          color="primary" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {result.originalRow.smallNumbers.map((num, i) => (
                            <Chip
                              key={i}
                              label={num}
                              size="small"
                              variant="outlined"
                              color={result.selectedNumbers.includes(num) ? "success" : "default"}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {result.selectedNumbers.length > 0 ? (
                            result.selectedNumbers.map((num, i) => (
                              <Chip
                                key={i}
                                label={num}
                                size="small"
                                color="success"
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              None
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={result.sum} 
                          color="secondary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${efficiency}%`}
                          color={parseFloat(efficiency) > 80 ? "success" : parseFloat(efficiency) > 50 ? "warning" : "error"}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Algorithm Explanation
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Approach:</strong> Two-Pointer Meet-in-the-Middle solution to the subset sum problem. This approach is optimal because:
            </Typography>
            <ul>
              <li><strong>Optimality:</strong> Guarantees finding the globally optimal solution</li>
              <li><strong>Superior Efficiency:</strong> O(2^(n/2) × n) time complexity - much better than O(2^n) brute force for n=12</li>
              <li><strong>Memory Efficient:</strong> O(2^(n/2)) space complexity, independent of target size</li>
              <li><strong>Scalability:</strong> Perfect for the constraint of ≤12 small numbers (64 combinations per half)</li>
              <li><strong>Two-Pointer Optimization:</strong> Uses binary search on sorted sums for efficient combination finding</li>
            </ul>
            <Typography variant="body2" color="text.secondary">
              <strong>Advantages over DP:</strong> Memory usage independent of target size, better performance for moderate n values, uses true two-pointer technique with binary search.
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default CSVOptimizer;
