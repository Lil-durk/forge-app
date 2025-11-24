import Resolver from '@forge/resolver';
import { storage, requestJira } from '@forge/api';
import { OpenAI } from 'openai'; // not AzureOpenAI

const resolver = new Resolver();

// Validate API key configuration for LiteLLM
console.log('=== API KEY CONFIGURATION ===');
console.log('API Key present:', !!process.env.OPENAI_API_KEY);
console.log('API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('API Key prefix:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 8) + '...' : 'N/A');
console.log('Base URL:', process.env.OPENAI_BASE_URL || 'Using default from code');

// Initialize OpenAI client (configured for Bonzai v2 API)
// Custom configuration to handle LiteLLM virtual keys (which may be shorter than standard OpenAI keys)
const openai = new OpenAI({
    baseURL: "https://api-v2.bonzai.iodigital.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    // Add default headers to ensure proper authentication
    defaultHeaders: {
        'User-Agent': 'ValidAIte-LiteLLM/1.0'
    },
    // Disable client-side validation that might reject shorter keys
    dangerouslyAllowBrowser: false
});

console.log('OpenAI client initialized successfully for LiteLLM virtual key');

// Test function to verify API key configuration
resolver.define('testApiKeyConfiguration', async (req) => {
    console.log('=== API KEY TEST CALLED ===');
    console.log('Testing LiteLLM virtual key configuration...');
    
    try {
        // Simple test to verify the OpenAI client is properly configured
        console.log('API Key present:', !!process.env.OPENAI_API_KEY);
        console.log('API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
        console.log('Base URL configured:', "https://api-v2.bonzai.iodigital.com/v1");
        console.log('OpenAI client status:', openai ? 'Initialized' : 'Not initialized');
        
        // Test a simple API call to verify connectivity
        // For LiteLLM, we might need to use a different model name
        const testCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Try with a more standard model name first
            messages: [
                {
                    role: "user",
                    content: "Say 'API key test successful' if you can read this message."
                }
            ],
            max_tokens: 50,
            temperature: 0
        });
        
        console.log('API test successful!');
        console.log('Response received:', !!testCompletion);
        
        return {
            success: true,
            message: 'LiteLLM virtual key configuration is working correctly',
            apiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
            baseURL: "https://api-v2.bonzai.iodigital.com/v1/chat/completions",
            testResponse: testCompletion.choices[0].message.content
        };
        
    } catch (error) {
        console.error('API key test failed:', error.message);
        return {
            success: false,
            error: error.message,
            apiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
            baseURL: "https://api-v2.bonzai.iodigital.com/v1/chat/completions"
        };
    }
});

// Validate Excel data using OpenAI
resolver.define('validateExcelData', async (req) => {
    console.log('validateExcelData called with:', req);
    
    try {
        const { excelData, validationRules } = req.payload;
        
        if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
            return {
                success: false,
                error: 'No Excel data provided or data is empty'
            };
        }

        // Prepare the data for OpenAI validation
        const dataPreview = excelData.slice(0, 10); // Send first 10 rows for validation
        const headers = Object.keys(excelData[0] || {});
        
        const prompt = `
You are an Excel data validator. Please analyze the following Excel data and validate it according to these rules:

Headers: ${headers.join(', ')}

Sample Data (first 10 rows):
${JSON.stringify(dataPreview, null, 2)}

Validation Rules:
${validationRules || 'Standard data validation - check for missing values, data type consistency, and format issues'}

Please provide a validation report in the following JSON format:
{
  "isValid": boolean,
  "overallScore": number (0-100),
  "issues": [
    {
      "type": "error" | "warning" | "info",
      "field": "field_name",
      "row": row_number,
      "message": "description of the issue",
      "suggestion": "how to fix it"
    }
  ],
  "summary": "brief summary of validation results",
  "recommendations": ["list of recommendations for data improvement"]
}

Focus on:
1. Missing or empty required fields
2. Data type inconsistencies
3. Format issues (dates, emails, phone numbers, etc.)
4. Duplicate entries
5. Outliers or suspicious values
6. Data completeness and quality
`;

        let completion;
        try {
            console.log('Making OpenAI API call...');
            console.log('OpenAI client status:', openai ? 'Available' : 'Not available');
            console.log('Request details:', {
                model: "claude-3-7-sonnet",
                messageCount: 2,
                temperature: 0.1,
                max_tokens: 2000
            });
            
            completion = await openai.chat.completions.create({
                model: "claude-3-7-sonnet",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional data validator. Always respond with valid JSON format."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 2000
            });
            console.log('OpenAI API call successful');
            console.log('Response received:', !!completion);
        } catch (apiError) {
            console.error('OpenAI API Error:', apiError.message);
            throw apiError;
        }

        let validationResult;
        try {
            let responseContent = completion.choices[0].message.content;
            console.log('Raw OpenAI response:', responseContent);
            
            // Extract JSON from markdown code blocks if present
            const jsonMatch = responseContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch) {
                console.log('Found JSON in markdown code block, extracting...');
                responseContent = jsonMatch[1];
            }
            
            // Clean up any remaining markdown artifacts
            responseContent = responseContent.trim();
            if (responseContent.startsWith('```json')) {
                responseContent = responseContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            }
            if (responseContent.startsWith('```')) {
                responseContent = responseContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            console.log('Cleaned response for JSON parsing:', responseContent.substring(0, 200) + '...');
            validationResult = JSON.parse(responseContent);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError.message);
            console.log('Raw OpenAI response:', completion.choices[0].message.content);
            console.log('Attempted to parse:', responseContent);
            throw parseError;
        }
        
        return {
            success: true,
            validation: validationResult,
            dataStats: {
                totalRows: excelData.length,
                totalColumns: headers.length,
                headers: headers
            }
        };

    } catch (error) {
        console.error('validateExcelData error:', error.message);
        return {
            success: false,
            error: error.message || 'Failed to validate Excel data'
        };
    }
});

// Monitor file uploads and store file information
resolver.define('monitorFileUpload', async (req) => {
    console.log('monitorFileUpload called with:', req);
    
    try {
        const { fileName, fileId, uploadTime, context } = req.payload;
        
        // Check if it's an Excel file
        if (!fileName || !fileName.match(/\.(xlsx|xls)$/i)) {
            return {
                success: false,
                message: 'Not an Excel file'
            };
        }
        
        // Store file upload information
        const fileInfo = {
            fileName,
            fileId,
            uploadTime: uploadTime || new Date().toISOString(),
            context: context || {},
            status: 'uploaded',
            validationStatus: 'pending'
        };
        
        console.log('Storing file info to storage...');
        await storage.set(`file_upload_${fileId}`, fileInfo);
        console.log('File info stored successfully');
        
        // Store in a list of recent uploads
        console.log('Getting recent uploads from storage...');
        const recentUploads = await storage.get('recent_uploads') || [];
        console.log('Current recent uploads count:', recentUploads.length);
        
        recentUploads.unshift(fileInfo);
        
        // Keep only last 10 uploads
        if (recentUploads.length > 10) {
            console.log('Trimming uploads list to 10 items');
            recentUploads.splice(10);
        }
        
        console.log('Updating recent uploads in storage...');
        await storage.set('recent_uploads', recentUploads);
        console.log('Recent uploads updated successfully');
        
        return {
            success: true,
            message: 'Excel file upload detected',
            fileInfo
        };
        
    } catch (error) {
        console.error('monitorFileUpload error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
});

// Get recent file uploads
resolver.define('getRecentUploads', async (req) => {
    console.log('=== GET RECENT UPLOADS CALLED ===');
    console.log('Request:', req);
    
    try {
        console.log('Fetching recent uploads from storage...');
        const recentUploads = await storage.get('recent_uploads') || [];
        console.log('Retrieved uploads count:', recentUploads.length);
        
        return {
            success: true,
            uploads: recentUploads
        };
    } catch (error) {
        console.error('getRecentUploads error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
});

// Update file validation status
resolver.define('updateFileValidationStatus', async (req) => {
    try {
        const { fileId, validationResult } = req.payload;
        
        const fileInfo = await storage.get(`file_upload_${fileId}`);
        if (fileInfo) {
            fileInfo.validationStatus = 'completed';
            fileInfo.validationResult = validationResult;
            fileInfo.validatedAt = new Date().toISOString();
            
            await storage.set(`file_upload_${fileId}`, fileInfo);
            
            // Update in recent uploads list
            const recentUploads = await storage.get('recent_uploads') || [];
            const index = recentUploads.findIndex(upload => upload.fileId === fileId);
            if (index !== -1) {
                recentUploads[index] = fileInfo;
                await storage.set('recent_uploads', recentUploads);
            }
        }
        
        return {
            success: true,
            fileInfo
        };
    } catch (error) {
        console.error('updateFileValidationStatus error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
});

// Get attachments from current Jira issue
resolver.define('getIssueAttachments', async (req) => {
    console.log('getIssueAttachments called with:', req);
    
    try {
        const { issueKey } = req.payload;
        
        if (!issueKey) {
            return {
                success: false,
                error: 'No issue key provided'
            };
        }
        
        console.log('Fetching attachments for issue:', issueKey);
        
        // Get issue details including attachments
        const response = await requestJira(`/rest/api/3/issue/${issueKey}?fields=attachment`);
        
        if (response.status !== 200) {
            console.error('Failed to fetch issue:', response.status, response.statusText);
            return {
                success: false,
                error: `Failed to fetch issue: ${response.status} ${response.statusText}`
            };
        }
        
        const issue = await response.json();
        const attachments = issue.fields.attachment || [];
        
        console.log('Found attachments:', attachments.length);
        
        // Filter for Excel files
        const excelAttachments = attachments.filter(attachment => 
            attachment.filename && attachment.filename.match(/\.(xlsx|xls)$/i)
        );
        
        console.log('Excel attachments found:', excelAttachments.length);
        
        // Format attachment data
        const formattedAttachments = excelAttachments.map(attachment => ({
            id: attachment.id,
            filename: attachment.filename,
            size: attachment.size,
            mimeType: attachment.mimeType,
            created: attachment.created,
            author: attachment.author ? attachment.author.displayName : 'Unknown',
            content: attachment.content // URL to download the file
        }));
        
        return {
            success: true,
            attachments: formattedAttachments,
            totalAttachments: attachments.length,
            excelAttachments: excelAttachments.length
        };
        
    } catch (error) {
        console.error('getIssueAttachments error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
});

// Download and process Excel attachment
resolver.define('processExcelAttachment', async (req) => {
    console.log('processExcelAttachment called with:', req);
    
    try {
        const { attachmentId, filename } = req.payload;
        
        if (!attachmentId) {
            return {
                success: false,
                error: 'No attachment ID provided'
            };
        }
        
        console.log('Downloading attachment:', attachmentId, filename);
        
        // Download the attachment content
        const response = await requestJira(`/rest/api/3/attachment/content/${attachmentId}`);
        
        if (response.status !== 200) {
            console.error('Failed to download attachment:', response.status, response.statusText);
            return {
                success: false,
                error: `Failed to download attachment: ${response.status} ${response.statusText}`
            };
        }
        
        // Get the file content as buffer
        const fileBuffer = await response.buffer();
        console.log('Downloaded file size:', fileBuffer.length, 'bytes');
        
        // Note: To parse Excel files server-side, you would need to add the 'xlsx' package
        // to the main package.json and import it here. For now, we'll return the file info
        // and let the frontend handle the Excel parsing.
        
        return {
            success: true,
            message: 'Excel attachment downloaded successfully',
            fileInfo: {
                id: attachmentId,
                filename: filename,
                size: fileBuffer.length,
                downloadedAt: new Date().toISOString()
            },
            // In a full implementation, you would parse the Excel here and return the data
            // For now, we'll indicate that the file needs to be processed on the frontend
            requiresFrontendProcessing: true
        };
        
    } catch (error) {
        console.error('processExcelAttachment error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
});

export const handler = resolver.getDefinitions();
