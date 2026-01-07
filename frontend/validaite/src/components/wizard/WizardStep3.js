/**
 * Requirements Wizard Step 3: Requirements Review
 * Displays generated requirements for user review and approval
 */

import React from 'react';
import PropTypes from 'prop-types';

const WizardStep3 = ({ 
  generatedRequirements, 
  error, 
  onBack, 
  onSkip, 
  onApply 
}) => {
  return (
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
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button className="btn-secondary" onClick={onSkip}>
          Use Standard Validation
        </button>
        <button className="btn-primary" onClick={onApply}>
          Apply Requirements
        </button>
      </div>
    </div>
  );
};

WizardStep3.propTypes = {
  generatedRequirements: PropTypes.arrayOf(PropTypes.string).isRequired,
  error: PropTypes.string,
  onBack: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired
};

WizardStep3.defaultProps = {
  error: ''
};

export default WizardStep3;
