# ValidAIte - Excel Data Validator

A Forge app for Jira Service Management that provides AI-powered Excel file validation using OpenAI. Users can upload Excel files and receive intelligent validation feedback with detailed analysis and recommendations.

## Features

- **Excel File Upload**: Support for .xlsx and .xls files
- **AI-Powered Validation**: Uses OpenAI GPT-3.5-turbo for intelligent data analysis
- **Real-time Processing**: Automatic validation triggered upon file upload
- **Custom Validation Rules**: Users can specify custom validation criteria
- **Comprehensive Reporting**: Detailed validation results with:
  - Overall data quality score (0-100)
  - Issue categorization (errors, warnings, info)
  - Field-specific feedback
  - Row-level issue identification
  - Actionable recommendations
- **Data Preview**: Visual table showing first 5 rows of uploaded data
- **Responsive Design**: Modern, mobile-friendly interface

## Architecture

### Backend (Forge Resolver)
- **Framework**: Atlassian Forge with Node.js 22.x
- **AI Integration**: OpenAI API for data validation
- **Memory**: 256MB ARM64 runtime
- **Resolver Functions**:
  - `validateExcelData`: Main validation function using OpenAI
  - `getHelloMessage`: Basic health check
  - `getServerTime`: Server time synchronization

### Frontend (React App)
- **Framework**: React 18.2.0
- **Excel Processing**: SheetJS (xlsx) library
- **Styling**: Custom CSS with modern gradients and animations
- **File Handling**: FileReader API for client-side Excel parsing
- **UI Components**: 
  - File upload with drag-and-drop styling
  - Data preview table
  - Validation results dashboard
  - Issue categorization and scoring

## Installation

1. **Prerequisites**:
   - Node.js 18+ 
   - Atlassian Forge CLI
   - OpenAI API key

2. **Setup**:
   ```bash
   # Install dependencies
   npm install
   cd static/validaite && npm install
   
   # Set OpenAI API key as environment variable
   export OPENAI_API_KEY="your-openai-api-key"
   
   # Build the React app
   npm run build
   
   # Deploy to Forge
   forge deploy
   forge install
   ```

3. **Configuration**:
   - Add your OpenAI API key to the Forge app environment variables
   - Configure the app in your Jira Service Management portal

## Usage

1. **Upload Excel File**:
   - Click "Choose Excel File" button
   - Select a .xlsx or .xls file
   - File is automatically processed and validated

2. **Custom Validation Rules** (Optional):
   - Enter specific validation criteria in the text area
   - Examples: "Check for valid email formats", "Ensure all phone numbers are present"

3. **Review Results**:
   - **Overall Score**: 0-100 quality rating
   - **Status Badge**: Valid/Issues Found indicator
   - **Issues List**: Detailed problems with suggestions
   - **Recommendations**: AI-generated improvement suggestions

## Validation Capabilities

The AI validator checks for:

- **Data Completeness**: Missing or empty required fields
- **Data Types**: Inconsistent data types across columns
- **Format Validation**: Email addresses, phone numbers, dates
- **Duplicate Detection**: Identifying duplicate entries
- **Outlier Analysis**: Suspicious or unusual values
- **Data Quality**: Overall completeness and consistency

## Sample Data

A sample Excel file (`sample-data.xlsx`) is included with test data containing:
- Employee information (Name, Email, Phone, Age, Department)
- Intentional data issues for testing validation
- Various data types and formats

## API Reference

### Backend Resolvers

#### `validateExcelData(payload)`
Validates Excel data using OpenAI.

**Parameters**:
- `excelData`: Array of objects representing Excel rows
- `validationRules`: Optional custom validation criteria

**Returns**:
```json
{
  "success": boolean,
  "validation": {
    "isValid": boolean,
    "overallScore": number,
    "issues": [
      {
        "type": "error|warning|info",
        "field": "field_name",
        "row": number,
        "message": "description",
        "suggestion": "how to fix"
      }
    ],
    "summary": "brief summary",
    "recommendations": ["list of recommendations"]
  },
  "dataStats": {
    "totalRows": number,
    "totalColumns": number,
    "headers": ["array of column names"]
  }
}
```

## Development

### Local Development
```bash
# Start React development server
cd static/validaite
npm start

# In another terminal, start Forge tunnel
forge tunnel
```

### Building for Production
```bash
# Build React app
cd static/validaite
npm run build

# Deploy to Forge
forge deploy
```

### Testing
- Use the provided `sample-data.xlsx` file for testing
- Test various Excel formats and data types
- Verify validation accuracy and AI responses

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (required)

### Manifest Configuration
The app is configured as a Jira Service Management portal request create property panel:
- **Module**: `jiraServiceManagement:portalRequestCreatePropertyPanel`
- **Resource**: Static React build files
- **Tunnel**: Port 3000 for development

## Security Considerations

- OpenAI API key is stored securely in Forge environment
- File processing happens client-side before sending to AI
- Only data samples (first 10 rows) are sent to OpenAI for analysis
- No persistent storage of uploaded files

## Troubleshooting

### Common Issues

1. **OpenAI API Errors**:
   - Verify API key is correctly set
   - Check API quota and billing status
   - Ensure network connectivity

2. **Excel Upload Issues**:
   - Verify file format (.xlsx, .xls)
   - Check file size limitations
   - Ensure file is not corrupted

3. **Build Errors**:
   - Run `npm install` in both root and `static/validaite` directories
   - Clear node_modules and reinstall if needed
   - Check Node.js version compatibility

## Future Enhancements

- Support for CSV files
- Batch file processing
- Custom validation rule templates
- Integration with Jira issue creation
- Advanced data visualization
- Export validation reports
- Multi-language support

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Forge documentation
3. Contact the development team
