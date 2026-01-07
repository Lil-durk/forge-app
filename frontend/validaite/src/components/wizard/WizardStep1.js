/**
 * Requirements Wizard Step 1: Purpose Selection
 * Handles use case selection and custom purpose input
 */

import React from 'react';
import PropTypes from 'prop-types';

const WizardStep1 = ({ 
  selectedUseCase, 
  customPurpose, 
  aiSuggestion,
  loading,
  error,
  useCases,
  excelData,
  onUseCaseSelect,
  onCustomPurposeChange,
  onGetAiSuggestion,
  onNext,
  onSkip
}) => {
  const handleNext = () => {
    if (!selectedUseCase && !customPurpose.trim()) {
      return;
    }
    onNext();
  };

  return (
    <div className="wizard-step">
      <h3>What's the purpose of this data?</h3>
      <p>Select a common use case or describe your custom purpose:</p>

      {!aiSuggestion && !loading && (
        <button 
          className="ai-suggestion-btn"
          onClick={onGetAiSuggestion}
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
            onClick={() => onUseCaseSelect(useCase.id)}
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
          onChange={onCustomPurposeChange}
          placeholder="Describe what you plan to do with this data..."
          rows={3}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="wizard-actions">
        <button className="btn-secondary" onClick={onSkip}>
          Skip Wizard
        </button>
        <button className="btn-primary" onClick={handleNext}>
          Next Step →
        </button>
      </div>
    </div>
  );
};

WizardStep1.propTypes = {
  selectedUseCase: PropTypes.string,
  customPurpose: PropTypes.string,
  aiSuggestion: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  useCases: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      requirements: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  ).isRequired,
  excelData: PropTypes.array,
  onUseCaseSelect: PropTypes.func.isRequired,
  onCustomPurposeChange: PropTypes.func.isRequired,
  onGetAiSuggestion: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired
};

WizardStep1.defaultProps = {
  selectedUseCase: '',
  customPurpose: '',
  aiSuggestion: '',
  loading: false,
  error: '',
  excelData: []
};

export default WizardStep1;
