import React, { useState } from 'react';

const DownloadableFilesTest = ({ pendingFiles, onCreateIssue }) => {
    const [summary, setSummary] = useState('');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [result, setResult] = useState(null);

    const handleCreateWithDownloadableFiles = async () => {
        if (!summary.trim()) {
            alert('Please enter a summary');
            return;
        }

        setIsCreating(true);
        setResult(null);

        try {
            const fileIds = pendingFiles.map(file => file.id);
            
            const response = await fetch('/api/webtrigger/create-issue-downloadable-trigger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    summary: summary.trim(),
                    description: description.trim() || 'Created via ValidAIte with downloadable files',
                    fileIds: fileIds
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setResult({
                    type: 'success',
                    message: `✅ ${data.message}`,
                    issueKey: data.issueKey,
                    issueUrl: data.issueUrl,
                    totalFiles: data.totalFiles
                });
                
                // Clear form
                setSummary('');
                setDescription('');
                
                // Notify parent component
                if (onCreateIssue) {
                    onCreateIssue(data);
                }
            } else {
                setResult({
                    type: 'error',
                    message: `❌ Error: ${data.error}`
                });
            }
        } catch (error) {
            console.error('Error creating issue with downloadable files:', error);
            setResult({
                type: 'error',
                message: `❌ Network error: ${error.message}`
            });
        } finally {
            setIsCreating(false);
        }
    };

    if (!pendingFiles || pendingFiles.length === 0) {
        return (
            <div style={{ 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '8px',
                margin: '20px 0'
            }}>
                <h3>📥 Create Issue with Downloadable Files</h3>
                <p style={{ color: '#6c757d' }}>
                    No files uploaded yet. Upload and validate Excel files first to create issues with downloadable file links.
                </p>
            </div>
        );
    }

    return (
        <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #dee2e6', 
            borderRadius: '8px',
            margin: '20px 0'
        }}>
            <h3>📥 Create Issue with Downloadable Files</h3>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
                Create a Jira issue with clickable download links for your Excel files using Forge's route API.
            </p>

            {/* File Summary */}
            <div style={{ 
                backgroundColor: '#e7f3ff', 
                padding: '15px', 
                borderRadius: '6px', 
                marginBottom: '20px',
                border: '1px solid #b3d9ff'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>Files to Include ({pendingFiles.length})</h4>
                {pendingFiles.map((file, index) => (
                    <div key={index} style={{ 
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        border: '1px solid #cce7ff'
                    }}>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>
                            📄 {file.fileName}
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                            Size: {Math.round(file.size / 1024)} KB | 
                            Status: {file.validationResult?.success ? '✅ Valid' : '⚠️ Has Issues'}
                        </div>
                    </div>
                ))}
            </div>

            {/* Issue Form */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '5px', 
                        fontWeight: 'bold',
                        color: '#333'
                    }}>
                        Issue Summary *
                    </label>
                    <input
                        type="text"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Enter issue summary..."
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                        disabled={isCreating}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '5px', 
                        fontWeight: 'bold',
                        color: '#333'
                    }}>
                        Description (Optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter issue description..."
                        rows="4"
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            resize: 'vertical'
                        }}
                        disabled={isCreating}
                    />
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={handleCreateWithDownloadableFiles}
                disabled={isCreating || !summary.trim()}
                style={{
                    backgroundColor: isCreating ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: isCreating ? 'not-allowed' : 'pointer',
                    width: '100%',
                    marginBottom: '15px'
                }}
            >
                {isCreating ? '🔄 Creating Issue with Downloadable Files...' : '📥 Create Issue with Downloadable Files'}
            </button>

            {/* Result Display */}
            {result && (
                <div style={{
                    padding: '15px',
                    borderRadius: '6px',
                    backgroundColor: result.type === 'success' ? '#d4edda' : '#f8d7da',
                    border: `1px solid ${result.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                    color: result.type === 'success' ? '#155724' : '#721c24'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                        {result.message}
                    </div>
                    
                    {result.type === 'success' && result.issueKey && (
                        <div>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>Issue:</strong> {result.issueKey}
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>Files:</strong> {result.totalFiles} downloadable files included
                            </div>
                            <div>
                                <a 
                                    href={result.issueUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ 
                                        color: '#0066cc', 
                                        textDecoration: 'underline',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    🔗 View Issue in Jira
                                </a>
                            </div>
                            <div style={{ 
                                marginTop: '10px', 
                                padding: '10px', 
                                backgroundColor: 'rgba(255,255,255,0.7)', 
                                borderRadius: '4px',
                                fontSize: '0.9em'
                            }}>
                                <strong>💡 How it works:</strong> The issue description contains clickable download links 
                                for each Excel file. Users can click on the file names to download the original files 
                                directly from the Jira issue using Forge's route API.
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Info Box */}
            <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                fontSize: '0.9em',
                color: '#856404'
            }}>
                <strong>🚀 NEW: Route API Implementation</strong><br/>
                This feature uses Forge's route API to create actual downloadable links in the Jira issue. 
                Files remain stored in the app and can be downloaded directly from the issue description.
            </div>
        </div>
    );
};

