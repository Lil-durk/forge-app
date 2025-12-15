# ValidAIte Conditional Display Guide

## Overview

ValidAIte now supports conditional display functionality that allows you to limit the app to specific JSM (Jira Service Management) request forms. This feature uses client-side conditional rendering to hide the app when it doesn't match your specified criteria.

## How It Works

The conditional display system works by:

1. **Context Detection**: Using Forge Bridge API to get information about the current JSM request form
2. **Criteria Evaluation**: Checking the current context against your configured display criteria
3. **Conditional Rendering**: Either showing the full app interface or returning `null` to hide it completely

## Configuration

### 1. Basic Configuration

Edit the `DISPLAY_CRITERIA` object in `/static/validaite/src/hooks/useConditionalDisplay.js`:

```javascript
const DISPLAY_CRITERIA = {
  // Option 1: Show only on specific request type names
  allowedRequestTypeNames: [
    'Data Validation Request',
    'Excel Review Request', 
    'File Upload Request',
    // Add your request type names here
  ],
  
  // Option 2: Show only on specific request type IDs  
  allowedRequestTypeIds: [
    '123', // Add specific request type IDs here
    '456',
  ],
  
  // Option 3: Show only on specific project keys
  allowedProjectKeys: [
    'PROJ1', // Add specific project keys here
    'SERVICE',
  ],
  
  // Option 4: Show on all forms (for testing)
  showOnAllForms: false, // Set to true to bypass all restrictions
};
```

### 2. Request Type Name Matching

The most common approach is to match by request type names:

```javascript
allowedRequestTypeNames: [
  'Data Validation Request',
  'Excel Review Request',
  'File Upload Request',
]
```

- Uses case-insensitive partial matching
- If the current request type contains any of these strings, the app will be displayed
- Example: "Data Validation Request for IT" would match "Data Validation Request"

### 3. Request Type ID Matching

For precise control, use request type IDs:

```javascript
allowedRequestTypeIds: [
  '123',
  '456',
]
```

- Requires exact ID matches
- More reliable but requires you to know the specific IDs
- You can find request type IDs in JSM admin or through the API

### 4. Project Key Matching

Limit to specific projects:

```javascript
allowedProjectKeys: [
  'SERVICEDESK',
  'SUPPORT',
]
```

- Matches the project key where the request form is located
- Useful if you want the app available across all request types in specific projects

## Testing and Debugging

### 1. Enable Testing Mode

For testing, temporarily enable the app on all forms:

```javascript
const DISPLAY_CRITERIA = {
  showOnAllForms: true, // This bypasses all other restrictions
  // ... other criteria
};
```

### 2. Development Debug Information

In development mode, you'll see:
- Display reason in the app header
- Console logs showing evaluation process
- Page context information

### 3. Force Display Function

In development, you can programmatically force display:

```javascript
// In your component or browser console
const { forceDisplay } = useConditionalDisplay();
forceDisplay(true); // Force show the app
forceDisplay(false); // Restore normal behavior
```

## Implementation Details

### 1. Loading States

The app shows a loading message while evaluating display conditions:

```
🔍 Checking if ValidAIte should be displayed on this request form...
```

### 2. Hidden State

When the app should not be displayed:
- Returns `null` (completely hidden)
- Logs the reason to console
- No visual footprint in the UI

### 3. Visible State

When the app should be displayed:
- Shows full interface
- Logs success reason to console
- In development, shows display reason

## Advanced Configuration

### 1. Custom Field Integration (Future Enhancement)

The system is prepared for custom field-based display logic:

```javascript
requiredCustomFieldValue: {
  fieldName: 'ShowValidAIte',
  expectedValue: 'true',
}
```

This would require additional API implementation to read custom field values.

### 2. Multiple Criteria Logic

Currently, the system uses OR logic between different criteria types:
- If ANY request type name matches → show
- OR if ANY request type ID matches → show  
- OR if ANY project key matches → show

### 3. Complex Conditions

For more complex logic, modify the `evaluateDisplayConditions` function in `useConditionalDisplay.js`.

## Deployment Considerations

### 1. Client-Side Security

⚠️ **Important**: This is client-side conditional rendering only. It should not be your only security measure for sensitive data. Always perform appropriate permission and data checks on the backend.

### 2. Empty Space

When hidden, the app returns `null`, which should not leave any visual gap. However, the Forge module iframe may still be present in the DOM.

### 3. Performance

The evaluation happens on every page load and is lightweight, but consider the impact if you add complex API calls for custom field checking.

## Troubleshooting

### 1. App Not Showing When Expected

1. Check browser console for evaluation logs
2. Verify your criteria configuration
3. Enable `showOnAllForms: true` temporarily
4. Check the page context information

### 2. App Showing When It Shouldn't

1. Verify your criteria are specific enough
2. Check for typos in request type names
3. Ensure `showOnAllForms` is set to `false`

### 3. Getting Request Type Information

To find the correct request type names or IDs:

1. Enable development mode
2. Check the PageContextDisplay component output
3. Look at browser console logs
4. Use JSM admin interface to view request types

## Example Configurations

### 1. Single Request Type

```javascript
const DISPLAY_CRITERIA = {
  allowedRequestTypeNames: ['Data Validation Request'],
  allowedRequestTypeIds: [],
  allowedProjectKeys: [],
  showOnAllForms: false,
};
```

### 2. Multiple Request Types in Specific Project

```javascript
const DISPLAY_CRITERIA = {
  allowedRequestTypeNames: [
    'Data Validation Request',
    'Excel Review Request',
  ],
  allowedProjectKeys: ['SERVICEDESK'],
  showOnAllForms: false,
};
```

### 3. Development/Testing Mode

```javascript
const DISPLAY_CRITERIA = {
  showOnAllForms: true, // Shows on all forms for testing
};
```

## Best Practices

1. **Start with Testing**: Use `showOnAllForms: true` initially to test your app
2. **Use Descriptive Names**: Match on descriptive request type names rather than IDs when possible
3. **Document Your Criteria**: Keep track of which request types should show the app
4. **Test Thoroughly**: Test on multiple request forms to ensure correct behavior
5. **Monitor Console**: Watch console logs to understand the evaluation process

## Future Enhancements

Potential future improvements:
- Custom field value checking
- More complex conditional logic
- Server-side validation integration
- Configuration UI for non-developers
- Regex pattern matching for request type names

---

This conditional display system gives you fine-grained control over where ValidAIte appears in your JSM portal while maintaining a clean, professional user experience.
