# External File Upload Integration Guide

## Overview

The ValidAIte app now includes functionality to monitor and validate Excel files uploaded externally to the Atlassian portal. This guide explains how to integrate the monitoring system with your existing file upload workflows.

## How It Works

### 1. File Upload Detection
The app monitors for Excel file uploads using the Forge storage API and polling mechanism:
- Checks for new uploads every 5 seconds when monitoring is enabled
- Filters for Excel files (.xlsx, .xls) only
- Stores upload metadata including filename, upload time, and validation status

### 2. Integration Points

#### Backend Functions (src/index.js)
- `monitorFileUpload`: Records when an Excel file is uploaded externally
- `getRecentUploads`: Retrieves list of recent Excel uploads
- `updateFileValidationStatus`: Updates validation status after AI processing

#### Frontend Monitoring (static/validaite/src/App.js)
- Real-time monitoring toggle
- Recent uploads display
- Automatic validation triggering for detected files

## Integration Steps

### Step 1: Trigger Upload Detection
When a user uploads an Excel file to your portal, call the monitoring function:

```javascript
// Example: In your file upload handler
const handleExternalUpload = async (file) => {
  if (file.name.match(/\.(xlsx|xls)$/i)) {
    await invoke('monitorFileUpload', {
      fileName: file.name,
      fileId: generateUniqueId(), // Your file ID system
      uploadTime: new Date().toISOString(),
      context: {
        userId: currentUser.id,
        uploadLocation: 'portal_page',
        // Add any relevant context
      }
    });
  }
};
```

### Step 2: File Content Processing
To enable full validation, you'll need to process the actual file content:

```javascript
// Example: Process uploaded Excel file
const processExcelFile = async (file) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // Trigger AI validation
    const validationResult = await invoke('validateExcelData', {
      excelData: jsonData,
      validationRules: 'Your custom validation rules'
    });
    
    // Update validation status
    await invoke('updateFileValidationStatus', {
      fileId: file.id,
      validationResult: validationResult
    });
  };
  reader.readAsArrayBuffer(file);
};
```

### Step 3: Event Listeners (Optional)
For real-time integration, you can set up event listeners:

```javascript
// Example: Listen for file upload events
document.addEventListener('fileUploaded', async (event) => {
  const { file, fileId } = event.detail;
  
  if (file.name.match(/\.(xlsx|xls)$/i)) {
    // Notify ValidAIte app
    await invoke('monitorFileUpload', {
      fileName: file.name,
      fileId: fileId,
      uploadTime: new Date().toISOString(),
      context: event.detail.context
    });
    
    // Process file content
    await processExcelFile(file);
  }
});
```

## Configuration Options

### Monitoring Settings
- **Polling Interval**: Currently set to 5 seconds (configurable in useEffect)
- **Upload History**: Stores last 10 uploads (configurable in backend)
- **File Types**: Excel files only (.xlsx, .xls)

### Validation Rules
Customize validation rules by modifying the `validateExcelData` function:

```javascript
const customValidationRules = `
  Custom validation requirements:
  1. All email fields must be valid email addresses
  2. Phone numbers must follow international format
  3. Date fields must be in YYYY-MM-DD format
  4. No duplicate entries allowed
  5. Required fields: name, email, phone
`;
```

## API Reference

### Backend Resolvers

#### `monitorFileUpload(payload)`
Records an Excel file upload for monitoring.

**Parameters:**
- `fileName` (string): Name of the uploaded file
- `fileId` (string): Unique identifier for the file
- `uploadTime` (string): ISO timestamp of upload
- `context` (object): Additional context information

**Returns:**
```javascript
{
  success: boolean,
  message: string,
  fileInfo: object
}
```

#### `getRecentUploads()`
Retrieves list of recent Excel uploads.

**Returns:**
```javascript
{
  success: boolean,
  uploads: [
    {
      fileName: string,
      fileId: string,
      uploadTime: string,
      validationStatus: 'pending' | 'completed' | 'error',
      context: object
    }
  ]
}
```

#### `updateFileValidationStatus(payload)`
Updates validation status for a file.

**Parameters:**
- `fileId` (string): File identifier
- `validationResult` (object): AI validation results

## UI Components

### Monitoring Status Indicator
Shows current monitoring state with visual feedback:
- Green pulsing dot: Active monitoring
- Gray dot: Monitoring disabled
- Toggle button to start/stop monitoring

### Recent Uploads List
Displays recent Excel uploads with:
- File name and upload timestamp
- Validation status (Pending, Validated, Error)
- Hover effects for better UX

## Troubleshooting

### Common Issues

1. **Files not detected**
   - Ensure `monitorFileUpload` is called after file upload
   - Check file extension matches (.xlsx, .xls)
   - Verify monitoring is enabled in the UI

2. **Validation not triggering**
   - Confirm file content is being processed
   - Check OpenAI API key configuration
   - Verify `validateExcelData` function is working

3. **Storage issues**
   - Check Forge storage permissions
   - Verify storage quota limits
   - Clear old upload records if needed

### Debug Mode
Enable debug logging by adding console.log statements:

```javascript
console.log('File upload detected:', fileName);
console.log('Validation result:', validationResult);
console.log('Recent uploads:', recentUploads);
```

## Security Considerations

1. **File Access**: Ensure proper permissions for file access
2. **Data Privacy**: Validate only necessary data, avoid sensitive information
3. **API Keys**: Secure OpenAI API key in environment variables
4. **Storage**: Implement data retention policies for upload records

## Future Enhancements

- Real-time WebSocket integration for instant notifications
- Batch validation for multiple files
- Custom validation rule templates
- Integration with Atlassian's native file upload events
- Advanced filtering and search for upload history
