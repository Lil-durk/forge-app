/**
 * Use Case Configuration
 * Defines predefined use cases and their validation requirements
 */

export const useCases = [
  {
    id: 'page-creation',
    name: 'Page Creation',
    description: 'Creating web pages or content pages',
    icon: '📄',
    requirements: [
      'Page title must be present and unique',
      'Content body should not be empty',
      'Meta description should be between 120-160 characters',
      'URL slug should be valid (no spaces, special characters)',
      'Author field must be specified',
      'Publication date should be in valid format',
      'Category/tags should be properly formatted',
      'Image URLs should be accessible and valid',
      'SEO keywords should be relevant and not excessive',
      'Content should meet minimum word count requirements'
    ]
  },
  {
    id: 'email-campaign',
    name: 'Email Campaign',
    description: 'Setting up email marketing campaigns',
    icon: '📧',
    requirements: [
      'Email addresses must be in valid format',
      'Subject line should be between 30-50 characters',
      'Sender name must be specified',
      'Email content should not contain spam trigger words',
      'Unsubscribe link must be present',
      'Recipient names should be properly formatted',
      'Send date should be in future',
      'Campaign type must be specified',
      'Target audience segments should be defined',
      'A/B testing variants should be properly configured'
    ]
  },
  {
    id: 'request-account',
    name: 'Request Account',
    description: 'Processing account creation requests',
    icon: '👤',
    requirements: [
      'Full name must be provided',
      'Email address must be valid and unique',
      'Phone number should be in correct format',
      'Department/role must be specified',
      'Manager approval should be documented',
      'Access level should be clearly defined',
      'Start date should be specified',
      'Security clearance level if applicable',
      'System access requirements should be listed',
      'Training completion status should be tracked'
    ]
  }
];
