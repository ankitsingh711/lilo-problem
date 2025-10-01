import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Tab, Tabs, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import CSVOptimizer from './components/CSVOptimizer';
import PriceComparison from './components/PriceComparison';
import { useLocation, useNavigate } from 'react-router-dom';

const StyledContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = location.pathname === '/price-comparison' ? 1 : 0;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      navigate('/');
    } else if (newValue === 1) {
      navigate('/price-comparison');
    }
  };

  return (
    <>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LILO Assignment - MERN Stack Solutions
          </Typography>
        </Toolbar>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
            },
            '& .Mui-selected': {
              color: 'white !important',
            },
          }}
        >
          <Tab label="CSV Optimizer (Question #1)" />
          <Tab label="Price Comparison (Question #2)" />
        </Tabs>
      </AppBar>

      <StyledContainer maxWidth="lg">
        <Routes>
          <Route path="/" element={<CSVOptimizer />} />
          <Route path="/price-comparison" element={<PriceComparison />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StyledContainer>
    </>
  );
};

export default App;
