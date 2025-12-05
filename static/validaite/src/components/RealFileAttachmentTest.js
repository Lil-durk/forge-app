import React, { useState } from 'react';
import { invoke } from '@forge/bridge';

const RealFileAttachmentTest = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const testRealFileAttachment = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            console.log('Testing real file attachment...');
            
            // Test with mock file data - in real usage this would come from uploaded files
            const testResult = await invoke('createIssueWithRealAttachment', {
                summary: 'Test Issue with Real File Attachment',
                description: 'This is a test issue to verify real file attachment functionality.',
                fileIds: [] // This would contain actual file IDs from uploaded files
            });

            console.log('Real file attachment test result:', testResult);
            setResult(testResult);

        } catch (err) {
            console.error('Error testing real file attachment:', err);
            setError(err.message || 'Unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const testAlternativeAttachment = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            console.log('Testing alternative file attachment...');
            
            const testResult = await invoke('createIssueWithAlternativeAttachment', {
                summary: 'Test Issue with Alternative File Attachment',
                description: 'This is a test issue to verify alternative file attachment functionality.',
                fileIds: [] // This would contain actual file IDs from uploaded files
            });

            console.log('Alternative file attachment test result:', testResult);
            setResult(testResult);

        } catch (err) {
            console.error('Error testing alternative file attachment:', err);
            setError(err.message || 'Unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>🔗 Real File Attachment Test</h2>
            <p>Test the new real file attachment functionality that attempts to attach actual files to Jira issues.</p>
            
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={testRealFileAttachment}
                    disabled={isLoading}
                    style={{
                        padding: '10px 20px',
                        marginRight: '10px',
                        backgroundColor: '#0052CC',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.6 : 1
                    }}
                >
                    {isLoading ? 'Testing...' : 'Test Real File Attachment'}
                </button>

                <button 
                    onClick={testAlternativeAttachment}
                    disabled={isLoading}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#6554C0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.6 : 1
                    }}
                >
                    {isLoading ? 'Testing...' : 'Test Alternative Method'}
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '15px',
                    backgroundColor: '#FFEBE6',
                    border: '1px solid #DE350B',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ color: '#DE350B', margin: '0 0 10px 0' }}>❌ Error</h4>
                    <p style={{ margin: 0, color: '#DE350B' }}>{error}</p>
                </div>
            )}

            {result && (
                <div style={{
                    padding: '15px',
                    backgroundColor: result.success ? '#E3FCEF' : '#FFEBE6',
                    border: `1px solid ${result.success ? '#00875A' : '#DE350B'}`,
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ 
                        color: result.success ? '#00875A' : '#DE350B', 
                        margin: '0 0 10px 0' 
                    }}>
                        {result.success ? '✅ Success' : '❌ Failed'}
                    </h4>
                    
                    <p><strong>Message:</strong> {result.message}</p>
                    
                    {result.success && (
                        <>
                            <p><strong>Issue Key:</strong> {result.issueKey}</p>
                            <p><strong>Issue URL:</strong> 
                                <a 
                                    href={result.issueUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#0052CC', marginLeft: '5px' }}
                                >
                                    {result.issueUrl}
                                </a>
                            </p>
                            
                            {result.attachedFiles !== undefined && (
                                <p><strong>Files Attached:</strong> {result.attachedFiles}/{result.totalFiles}</p>
                            )}
                            
                            {result.attachmentResults && result.attachmentResults.length > 0 && (
                                <div style={{ marginTop: '15px' }}>
                                    <h5>Attachment Results:</h5>
                                    <ul>
                                        {result.attachmentResults.map((attachResult, index) => (
                                            <li key={index} style={{
                                                color: attachResult.success ? '#00875A' : '#DE350B'
                                            }}>
                                                <strong>{attachResult.fileName}:</strong> {' '}
                                                {attachResult.success ? 
                                                    `✅ ${attachResult.message}` : 
                                                    `❌ ${attachResult.error}`
                                                }
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                    
                    {result.error && (
                        <p style={{ color: '#DE350B' }}><strong>Error:</strong> {result.error}</p>
                    )}
                </div>
            )}

            <div style={{
                padding: '15px',
                backgroundColor: '#F4F5F7',
                border: '1px solid #DFE1E6',
                borderRadius: '4px',
                marginTop: '20px'
            }}>
                <h4 style={{ margin: '0 0 10px 0' }}>ℹ️ How it works</h4>
                <ol>
                    <li><strong>Creates Jira Issue:</strong> First creates the issue with ADF-formatted description containing file information</li>
                    <li><strong>Attempts File Attachment:</strong> Then tries to attach the actual Excel files as real attachments</li>
                    <li><strong>Reports Results:</strong> Shows which files were successfully attached and which failed</li>
                    <li><strong>Fallback:</strong> If attachment fails, file information is still available in the description</li>
                </ol>
                
                <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#6B778C' }}>
                    <strong>Note:</strong> This test uses empty file arrays. In real usage, you would first upload Excel files 
                    which get stored with file IDs, then pass those IDs to create the issue with attachments.
                </p>
            </div>
        </div>
    );
};

export default RealFileAttachmentTest;
