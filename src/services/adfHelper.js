/**
 * Atlassian Document Format (ADF) Helper
 * Converts plain text/markdown to ADF format for Jira API
 */

/**
 * Create a simple ADF document with just text
 */
export const createSimpleADF = (text) => {
    return {
        type: "doc",
        version: 1,
        content: [
            {
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        text: text || ""
                    }
                ]
            }
        ]
    };
};

/**
 * Create ADF with file information
 */
export const createFileInfoADF = (description, fileInfos) => {
    const content = [];
    
    // Add main description
    if (description) {
        content.push({
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: description
                }
            ]
        });
    }

    if (fileInfos && fileInfos.length > 0) {
        // Add heading
        content.push({
            type: "heading",
            attrs: { level: 2 },
            content: [
                {
                    type: "text",
                    text: "📎 Uploaded Files"
                }
            ]
        });

        // Add file information
        fileInfos.forEach(fileInfo => {
            const validationStatus = fileInfo.validationResult?.success ? '✅ Valid' : '⚠️ Has Issues';
            const fileSize = Math.round(fileInfo.size / 1024);

            // File name (bold)
            content.push({
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        text: fileInfo.fileName,
                        marks: [{ type: "strong" }]
                    }
                ]
            });

            // File details as bullet list
            const listItems = [
                `Size: ${fileSize} KB`,
                `Type: ${fileInfo.mimeType}`,
                `Validation: ${validationStatus}`
            ];

            if (fileInfo.validationResult && !fileInfo.validationResult.success) {
                listItems.push(`Issues: ${fileInfo.validationResult.errors?.join(', ') || 'Unknown validation errors'}`);
            }

            content.push({
                type: "bulletList",
                content: listItems.map(item => ({
                    type: "listItem",
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: item
                                }
                            ]
                        }
                    ]
                }))
            });
        });

        // Add note
        content.push({
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: "Note: Files are stored securely and can be accessed through the ValidAIte app.",
                    marks: [{ type: "em" }]
                }
            ]
        });
    }

    return {
        type: "doc",
        version: 1,
        content: content
    };
}