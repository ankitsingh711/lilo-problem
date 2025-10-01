# LILO Assignment - MERN Stack Solutions

A comprehensive MERN stack application implementing solutions for two coding challenges: CSV number optimization and price benchmarking across e-commerce platforms.

## 🚀 Features

### Question #1: CSV Number Optimization
- **Algorithm**: Dynamic Programming solution to the subset sum problem
- **Input**: CSV files with "big number" and up to 12 "small numbers" per row
- **Output**: Optimal combination of small numbers that sum closest to big number without exceeding it
- **UI**: Drag & drop file upload + manual data input

### Question #2: Price Benchmarking
- **Sites**: Newegg, Amazon, Best Buy
- **Input**: Newegg item number
- **Output**: Price comparison across all supported sites
- **Features**: Real-time scraping, best deal highlighting, responsive UI

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Material-UI
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB (optional for caching)
- **Web Scraping**: Cheerio + Puppeteer
- **File Processing**: Multer + CSV-Parser

## 📁 Project Structure

```
lilo-assignment/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript definitions
│   │   └── App.tsx
│   ├── public/
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript definitions
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (optional, for caching)

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd lilo-assignment
npm run install:all
```

2. **Environment Setup**:
```bash
cd server
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Development Servers**:
```bash
# From root directory
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

### Individual Services

**Backend Only**:
```bash
cd server
npm run dev
```

**Frontend Only**:
```bash
cd client
npm start
```

## 📊 Question #1: CSV Optimization

### Algorithm Explanation

**Problem**: Find the combination of small numbers whose sum is as close as possible to the big number without exceeding it.

**Solution**: Dynamic Programming approach to the subset sum problem.

```typescript
// Time Complexity: O(n × target)
// Space Complexity: O(n × target)
// Where n = number of small numbers, target = big number
```

**Why this approach is optimal**:
1. **Optimality**: Guarantees finding the globally optimal solution
2. **Efficiency**: O(n × target) is efficient for given constraints (≤12 numbers)
3. **Correctness**: Handles duplicate numbers and edge cases properly
4. **Scalability**: Well-suited for the problem constraints

**Advantages**:
- Always finds the best possible solution
- Handles duplicate numbers correctly
- Memory efficient for given constraints
- Clear separation of concerns

**Limitations**:
- Memory usage grows with target size
- Not suitable for very large targets (>10^6)
- Could be overkill for very small datasets

### API Endpoints

```http
POST /api/csv/optimize
Content-Type: multipart/form-data
Body: csvFile (file)

POST /api/csv/optimize-data
Content-Type: application/json
Body: { "rows": [{"bigNumber": 10, "smallNumbers": [1,2,3,4,5]}] }
```

### Example Usage

**Input CSV**:
```csv
10,1,2,3,4,5,6
20,5,10,15,8,12
```

**Output**:
```json
[
  {
    "selectedNumbers": [1, 3, 6],
    "sum": 10,
    "originalRow": {"bigNumber": 10, "smallNumbers": [1,2,3,4,5,6]}
  },
  {
    "selectedNumbers": [8, 12],
    "sum": 20,
    "originalRow": {"bigNumber": 20, "smallNumbers": [5,10,15,8,12]}
  }
]
```

## 🛒 Question #2: Price Benchmarking

### Implementation Strategy

**Challenge**: Scrape product prices from multiple e-commerce sites with different structures and anti-bot measures.

**Solution**: Multi-strategy approach using different techniques per site:

1. **Newegg**: Static HTML parsing with Cheerio (fast, reliable for structured data)
2. **Amazon**: Dynamic rendering with Puppeteer (handles JavaScript-heavy pages)
3. **Best Buy**: Static HTML parsing with search functionality

### Technical Details

**Scraping Strategies**:
- **Rate Limiting**: Prevents abuse with configurable limits
- **Error Handling**: Graceful fallbacks when scraping fails
- **Retry Logic**: Automatic retries for transient failures
- **User Agent Rotation**: Mimics real browser requests

**Site-Specific Challenges**:
- **Newegg**: Direct item lookup, clean CSS selectors
- **Amazon**: Heavy JavaScript, requires rendering, complex product matching
- **Best Buy**: Search-based lookup, dynamic content loading

### API Endpoints

```http
POST /api/price/compare
Content-Type: application/json
Body: { "itemNumber": "N82E16834725142" }

GET /api/price/compare/:itemNumber
```

### Example Response

```json
{
  "success": true,
  "data": {
    "itemNumber": "N82E16834725142",
    "productName": "Gaming Laptop",
    "prices": [
      {
        "site": "Newegg",
        "price": 1299.99,
        "currency": "USD",
        "available": true,
        "url": "https://www.newegg.com/p/N82E16834725142"
      },
      {
        "site": "Amazon",
        "price": 1249.99,
        "currency": "USD",
        "available": true,
        "url": "https://www.amazon.com/s?k=N82E16834725142"
      }
    ],
    "timestamp": "2024-10-01T01:21:04.000Z"
  }
}
```

### Limitations & Next Steps

**Current Limitations**:
1. Web scraping is fragile - site changes can break selectors
2. Anti-bot measures may block requests
3. Price accuracy depends on site's current layout
4. Performance limited by network requests and page rendering

**Next Iteration Priorities**:
1. **Caching Layer**: Reduce redundant requests, improve performance
2. **Official APIs**: Use Amazon Product Advertising API, eBay API where available
3. **Proxy Rotation**: Better reliability and anti-detection
4. **Product Matching**: Improved algorithms for cross-site product identification
5. **Price History**: Database storage for trend analysis
6. **Monitoring**: Alerting for scraping failures and site changes

## 🔧 Development

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Error Handling**: Comprehensive try-catch blocks
- **Logging**: Structured logging for debugging

### Testing
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

### Building for Production
```bash
npm run build
```

## 🚀 Deployment

The application is containerized and can be deployed to various platforms:

### Docker
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Environment Variables

**Server (.env)**:
```bash
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/lilo-assignment
RATE_LIMIT_REQUESTS=50
SCRAPING_TIMEOUT=10000
```

## 📈 Performance Considerations

### CSV Optimization
- **Memory**: O(n × target) space complexity
- **Time**: O(n × target) time complexity
- **Scalability**: Efficient for constraints (≤12 small numbers)

### Price Scraping
- **Rate Limiting**: 10 requests/minute for price endpoints
- **Timeout**: 10 second timeout per request
- **Concurrent Requests**: Parallel scraping across sites
- **Caching**: Results cached for 5 minutes (configurable)

## 🛡️ Security

- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Sanitizes all user inputs
- **CORS**: Configured for specific origins
- **Error Handling**: No sensitive information in error messages
- **File Upload**: Size limits and type validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Ankit Singh**  
- Email: [your-email@example.com]
- LinkedIn: [your-linkedin-profile]
- GitHub: [your-github-profile]

---

**Note**: This implementation demonstrates clean architecture, proper error handling, and scalable design patterns suitable for production environments while solving both algorithmic optimization and real-world web scraping challenges.
