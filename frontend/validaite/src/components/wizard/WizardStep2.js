/**
 * Requirements Wizard Step 2: Requirements Generation
 * Displays loading state while AI generates custom requirements
 */

import React from 'react';

const WizardStep2 = () => {
  return (
    <div className="wizard-step">
      <div className="generating-requirements">
        <div className="spinner"></div>
        <h3>Generating Custom Requirements...</h3>
        <p>AI is creating validation rules tailored to your use case</p>
      </div>
    </div>
  );
};

export default WizardStep2;
