/**
 * Requirements Wizard Component
 * AI-powered wizard that helps users define custom validation requirements
 * based on their specific use case and data purpose
 */

import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import WizardStep1 from './wizard/WizardStep1';
import WizardStep2 from './wizard/WizardStep2';
import WizardStep3 from './wizard/WizardStep3';
import { useCases } from './wizard/useCaseConfig';

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
          <WizardStep1
            selectedUseCase={selectedUseCase}
            customPurpose={customPurpose}
            aiSuggestion={aiSuggestion}
            loading={loading}
            error={error}
            useCases={useCases}
            excelData={excelData}
            onUseCaseSelect={handleUseCaseSelect}
            onCustomPurposeChange={handleCustomPurposeChange}
            onGetAiSuggestion={getAiSuggestion}
            onNext={nextStep}
            onSkip={skipWizard}
          />
        )}

        {currentStep === 2 && <WizardStep2 />}

        {currentStep === 3 && (
          <WizardStep3
            generatedRequirements={generatedRequirements}
            error={error}
            onBack={() => setCurrentStep(1)}
            onSkip={skipWizard}
            onApply={applyRequirements}
          />
        )}
      </div>
    </div>
  );
};

export default RequirementsWizard;
