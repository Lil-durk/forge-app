# ValidAIte - Intelligent Excel Data Validator

A comprehensive Forge app for Jira Service Management that provides AI-powered Excel file validation using OpenAI. Features intelligent data analysis, custom validation requirements generation, caching for performance optimization, and seamless Jira integration.

## 🚀 Features

### Core Validation
- **Excel File Upload**: Support for .xlsx and .xls files with drag-and-drop interface
- **AI-Powered Validation**: Advanced OpenAI GPT integration for intelligent data analysis
- **Real-time Processing**: Automatic validation triggered upon file upload
- **Custom Validation Rules**: AI-generated custom validation criteria based on data purpose
- **Comprehensive Reporting**: Detailed validation results with scoring and recommendations

### Advanced Features
- **Requirements Wizard**: Multi-step wizard for generating tailored validation requirements
- **Intelligent Caching**: Performance optimization through file content-based caching
- **Jira Integration**: Direct attachment processing from Jira issues
- **Data Preview**: Visual table showing sample data with responsive design
- **File Management**: Upload monitoring and validation status tracking
- **Alternative Scoring**: Multiple validation approaches for comprehensive analysis

### User Experience
- **Modern UI**: Tailwind CSS with responsive design and animations
- **Component-Based Architecture**: Modular React components for maintainability
- **Progressive Enhancement**: Step-by-step validation process with clear feedback
- **Error Handling**: Comprehensive error management with detailed logging

## 🏗️ Architecture

### Backend (Forge Resolver)
- **Framework**: Atlassian Forge with Node.js 22.x
- **Runtime**: 256MB ARM64 for optimal performance
- **AI Integration**: OpenAI API v6.9.1 for advanced data validation
- **Caching Layer**: Intelligent content-based caching system
- **Logging**: Comprehensive logging system with structured output

#### Key Services
- `validation.js` - Core Excel data validation logic
- `requirementsWizard.js` - AI-powered requirements generation
- `fileContentCache.js` - Performance-optimized caching
- `jira.js` - Jira Service Management integration
- `storage.js` - File upload and status management
- `ai/` - AI services (prompt building, response parsing, caching)
- `requirements/` - Custom validation and data analysis

### Frontend (React App)
- **Framework**: React 18.2.0 with modern hooks
- **Styling**: Tailwind CSS v3.4.18 with custom animations
- **Excel Processing**: SheetJS (xlsx) v0.18.5 for client-side parsing
- **UI Components**: Lucide React icons with variance authority
- **Build Tool**: React Scripts 5.0.1

#### Key Components
- `RequirementsWizard.js` - Multi-step validation setup
- `FileAttachmentManager.js` - Advanced file handling
- `ValidationResults.js` - Comprehensive results display
- `JiraIntegration.js` - Seamless Jira connectivity
- `PostCreationAttachment.js` - Post-validation file management
- `wizard/` - Step-by-step wizard components

## 🛠️ Installation

### Prerequisites
- **Node.js**: 18+ (22.x recommended)
- **Atlassian Forge CLI**: Latest version
- **OpenAI API Key**: From platform.openai.com
- **Jira Service Management**: Admin access for installation

### Setup Process

1. **Clone and Install Dependencies**:
   ```bash
   # Clone repository
   git clone <repository-url>
   cd forge-app
   
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend/validaite
   npm install
   cd ../..
   ```

2. **Environment Configuration**:
   ```bash
   # Set OpenAI API key (required)
   forge variables set OPENAI_API_KEY your-openai-api-key-here
   
   # Verify configuration
   forge variables list
   ```

3. **Build and Deploy**:
   ```bash
   # Build React frontend
   npm run build
   
   # Deploy to Forge
   forge deploy
   
   # Install in your Jira instance
   forge install
   ```

4. **Development Setup** (Optional):
   ```bash
   # Start local development server
   cd frontend/validaite
   npm start
   
   # In another terminal, start Forge tunnel
   forge tunnel
   ```

## 📊 API Reference

### Core Resolver Functions

#### Data Validation
- **`validateExcelData(payload)`** - Main validation with OpenAI
- **`validateWithCustomRequirements(payload)`** - Custom validation logic
- **`analyzeDataPurpose(payload)`** - AI-powered purpose analysis

#### Requirements Management
- **`generateCustomRequirements(payload)`** - AI-generated validation rules
- **`analyzeDataPurpose(payload)`** - Intelligent data purpose detection

#### File Management
- **`monitorFileUpload(payload)`** - Track upload status
- **`getRecentUploads()`** - Retrieve upload history
- **`updateFileValidationStatus(payload)`** - Update validation results

#### Caching System
- **`checkFileContentChange(payload)`** - Content change detection
- **`cacheValidationResult(payload)`** - Store validation results
- **`getCachedValidationResult(payload)`** - Retrieve cached results
- **`clearValidationCache()`** - Clear all cached data
- **`getCacheStatistics()`** - Cache performance metrics

#### Jira Integration
- **`getIssueAttachments(payload)`** - Fetch issue attachments
- **`processExcelAttachment(payload)`** - Process Excel attachments

### Response Format

```json
{
  "success": true,
  "validation": {
    "isValid": true,
    "overallScore": 95,
    "issues": [
      {
        "type": "warning",
        "field": "email",
        "row": 3,
        "message": "Email format should be validated",
        "suggestion": "Use proper email validation pattern"
      }
    ],
    "summary": "Data quality is excellent with minor formatting improvements needed",
    "recommendations": [
      "Implement email format validation",
      "Add phone number formatting"
    ]
  },
  "dataStats": {
    "totalRows": 150,
    "totalColumns": 8,
    "headers": ["Name", "Email", "Phone", "Department"]
  },
  "cacheInfo": {
    "cached": true,
    "timestamp": "2026-01-07T14:48:03.000Z"
  }
}
```

## 🎯 Usage Guide

### Basic Validation Flow
1. **Upload File**: Drag and drop or select Excel file
2. **Auto-Analysis**: System analyzes data purpose automatically
3. **Custom Requirements**: AI generates tailored validation rules
4. **Validation**: Comprehensive analysis with scoring
5. **Results Review**: Detailed findings with actionable recommendations

### Requirements Wizard
1. **Step 1**: File upload and basic analysis
2. **Step 2**: Purpose confirmation and customization
3. **Step 3**: Validation execution and results

### Advanced Features
- **Cache Management**: Automatic caching for improved performance
- **Jira Integration**: Process attachments directly from issues
- **Alternative Scoring**: Multiple validation approaches
- **Export Results**: Download validation reports

## 🧪 Testing

### Unit Tests
```bash
# Run Jest tests
npm test

# Run with coverage
npm test -- --coverage
```

### Manual Testing
- Use provided sample data files in `/tests` directory
- Test various Excel formats and data types
- Verify validation accuracy with intentional data issues
- Test caching behavior with repeated uploads

### Performance Testing
- Monitor cache hit rates via `getCacheStatistics`
- Test with large files (1000+ rows)
- Verify response times for cached vs. uncached data

## 🔧 Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=your-openai-api-key

# Optional (configured in manifest.yml)
NODE_ENV=production
LOG_LEVEL=info
```

### Manifest Configuration
- **Runtime**: Node.js 22.x with ARM64 architecture
- **Memory**: 256MB allocation
- **Permissions**: Storage, Jira read access, external fetch
- **External APIs**: OpenAI, Bonzai integration

### Tailwind Configuration
Custom styling with:
- Component utilities for consistent design
- Animation classes for enhanced UX
- Responsive breakpoints for mobile support
- Custom color schemes for validation states

## 🔒 Security & Performance

### Security Features
- **API Key Management**: Secure Forge environment variables
- **Input Validation**: Comprehensive payload validation
- **Error Handling**: Structured error responses without sensitive data
- **Content Filtering**: Safe data processing before AI analysis

### Performance Optimizations
- **Intelligent Caching**: Content-based cache invalidation
- **Lazy Loading**: Component-based loading for faster initial render
- **Batch Processing**: Efficient data handling for large files
- **Memory Management**: Optimized for 256MB runtime environment

### Monitoring & Logging
- **Structured Logging**: JSON-formatted logs with contextual information
- **Performance Metrics**: Request duration and cache hit rate tracking
- **Error Tracking**: Comprehensive error logging with stack traces
- **Cache Statistics**: Real-time caching performance monitoring

## 🚨 Troubleshooting

### Common Issues

1. **OpenAI API Errors**:
   ```bash
   # Check API key configuration
   forge variables list
   
   # Verify API quota and billing
   curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
   ```

2. **Build Failures**:
   ```bash
   # Clear and reinstall dependencies
   rm -rf node_modules frontend/validaite/node_modules
   npm install
   cd frontend/validaite && npm install
   
   # Rebuild application
   npm run build
   ```

3. **Cache Issues**:
   ```bash
   # Clear validation cache via resolver
   # Use clearValidationCache() function
   
   # Check cache statistics
   # Use getCacheStatistics() function
   ```

4. **Jira Integration Problems**:
   - Verify app permissions in Jira admin
   - Check issue attachment access rights
   - Validate attachment file formats

### Debug Mode
Enable detailed logging by setting log level:
```bash
# Enhanced debugging information
forge logs --follow
```

## 🛣️ Roadmap

### Planned Features
- **Multi-language Support**: Internationalization for global teams
- **Custom Validation Templates**: Pre-built validation rule sets
- **Batch File Processing**: Multiple file validation in single session
- **Advanced Reporting**: PDF export and detailed analytics
- **Integration Expansion**: SharePoint, Google Sheets connectivity
- **Machine Learning**: Pattern recognition for data quality improvements

### Performance Enhancements
- **Streaming Processing**: Large file handling optimization
- **Background Processing**: Async validation for better UX
- **CDN Integration**: Static asset optimization
- **Database Caching**: Persistent cache layer

## 📝 Contributing

### Development Guidelines
1. Follow existing code structure and naming conventions
2. Add unit tests for new features
3. Update documentation for API changes
4. Use ESLint configuration for code consistency
5. Follow React best practices for component development

### Code Quality
- **Linting**: ESLint with React hooks plugin
- **Testing**: Jest for unit tests with coverage requirements
- **Documentation**: JSDoc comments for complex functions
- **Type Safety**: PropTypes for React components

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

### Getting Help
1. **Documentation**: Check this README and linked guides
2. **Troubleshooting**: Review common issues section
3. **Logs**: Use `forge logs` for debugging information
4. **Community**: Atlassian Developer Community forums

### Issue Reporting
When reporting issues, include:
- Forge app version and environment
- Error messages and logs
- Steps to reproduce
- Excel file characteristics (if applicable)
- Browser and OS information

### Contact
For technical support and questions:
- **Development Team**: [Contact Information]
- **Atlassian Forge**: [Official Documentation]
- **OpenAI API**: [Platform Documentation]

---

**ValidAIte** - Transforming data validation through intelligent AI analysis in Jira Service Management.
