/**
 * Requirements Wizard Component
 * AI-powered wizard that helps users define custom validation requirements
 * based on their specific use case and data purpose
 */

import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

const RequirementsWizard = ({ 
  excelData, 
  fileName, 
  onRequirementsGenerated, 
  onSkip,
  isVisible 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedUseCase, setSelectedUseCase] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [generatedRequirements, setGeneratedRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const useCases = [
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

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(1);
      setSelectedUseCase('');
      setCustomPurpose('');
      setAiSuggestion('');
      setGeneratedRequirements([]);
      setError('');
    }
  }, [isVisible]);

  const getAiSuggestion = async () => {
    if (!excelData || excelData.length === 0) return;

    setLoading(true);
    try {
      const result = await invoke('analyzeDataPurpose', {
        excelData: excelData.slice(0, 5),
        fileName: fileName
      });

      if (result.success) {
        setAiSuggestion(result.suggestion);
      } else {
        setError('Failed to get AI suggestion: ' + result.error);
      }
    } catch (error) {
      setError('Error getting AI suggestion: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRequirements = async () => {
    setLoading(true);
    setError('');

    try {
      let requirements = [];
      
      if (selectedUseCase) {
        const useCase = useCases.find(uc => uc.id === selectedUseCase);
        if (useCase) {
          requirements = useCase.requirements;
        }
      }

      if (customPurpose.trim()) {
        const result = await invoke('generateCustomRequirements', {
          purpose: customPurpose,
          excelData: excelData.slice(0, 5),
          fileName: fileName,
          baseRequirements: requirements
        });

        if (result.success) {
          requirements = result.requirements;
        } else {
          setError('Failed to generate custom requirements: ' + result.error);
          return;
        }
      }

      setGeneratedRequirements(requirements);
      setCurrentStep(3);
    } catch (error) {
      setError('Error generating requirements: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCaseSelect = (useCaseId) => {
    setSelectedUseCase(useCaseId);
    setError('');
  };

  const handleCustomPurposeChange = (e) => {
    setCustomPurpose(e.target.value);
    setError('');
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!selectedUseCase && !customPurpose.trim()) {
        setError('Please select a use case or describe your custom purpose');
        return;
      }
      setCurrentStep(2);
      generateRequirements();
    }
  };

  const applyRequirements = () => {
    onRequirementsGenerated({
      useCase: selectedUseCase,
      customPurpose: customPurpose,
      requirements: generatedRequirements
    });
  };

  const skipWizard = () => {
    onSkip();
  };

  if (!isVisible) return null;

  return (
    <div className="requirements-wizard-overlay">
      <div className="requirements-wizard">
        <div className="wizard-header">
          <h2>🧙‍♂️ Requirements Wizard</h2>
          <p>Let's create custom validation requirements for your data!</p>
          <div className="wizard-progress">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        {currentStep === 1 && (
          <div className="wizard-step">
            <h3>What's the purpose of this data?</h3>
            <p>Select a common use case or describe your custom purpose:</p>

            {!aiSuggestion && !loading && (
              <button 
                className="ai-suggestion-btn"
                onClick={getAiSuggestion}
                disabled={!excelData}
              >
                Get AI Suggestion
              </button>
            )}

            {loading && (
              <div className="ai-suggestion loading">
                <div className="spinner"></div>
                <span>AI is analyzing your data...</span>
              </div>
            )}

            {aiSuggestion && (
              <div className="ai-suggestion">
                <h4>🤖 AI Suggestion:</h4>
                <p>{aiSuggestion}</p>
              </div>
            )}

            <div className="use-cases">
              {useCases.map(useCase => (
                <div
                  key={useCase.id}
                  className={`use-case-card ${selectedUseCase === useCase.id ? 'selected' : ''}`}
                  onClick={() => handleUseCaseSelect(useCase.id)}
                >
                  <div className="use-case-icon">{useCase.icon}</div>
                  <div className="use-case-content">
                    <h4>{useCase.name}</h4>
                    <p>{useCase.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="custom-purpose">
              <h4>Or describe your custom purpose:</h4>
              <textarea
                value={customPurpose}
                onChange={handleCustomPurposeChange}
                placeholder="Describe what you plan to do with this data..."
                rows={3}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="wizard-actions">
              <button className="btn-secondary" onClick={skipWizard}>
                Skip Wizard
              </button>
              <button className="btn-primary" onClick={nextStep}>
                Next Step →
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="wizard-step">
            <div className="generating-requirements">
              <div className="spinner"></div>
              <h3>Generating Custom Requirements...</h3>
              <p>AI is creating validation rules tailored to your use case</p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="wizard-step">
            <h3>Review Your Custom Requirements</h3>
            <p>These validation rules have been generated for your specific use case:</p>

            <div className="requirements-list">
              {generatedRequirements.map((requirement, index) => (
                <div key={index} className="requirement-item">
                  <span className="requirement-number">{index + 1}</span>
                  <span className="requirement-text">{requirement}</span>
                </div>
              ))}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="wizard-actions">
              <button className="btn-secondary" onClick={() => setCurrentStep(1)}>
                ← Back
              </button>
              <button className="btn-secondary" onClick={skipWizard}>
                Use Standard Validation
              </button>
              <button className="btn-primary" onClick={applyRequirements}>
                Apply Requirements
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequirementsWizard;
