
import React, { memo } from 'react';
import { Building2, User, FileText, CheckCircle } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
  const steps = [
    { label: 'Empresa', icon: Building2 },
    { label: 'Cliente', icon: User },
    { label: 'Itens', icon: FileText },
    { label: 'Resumo', icon: CheckCircle },
  ];

  return (
    <div className="w-full mb-8 select-none">
      <div className="flex items-center justify-between relative">
        {/* Background Track */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-800 -z-10 rounded-full"></div>
        
        {/* Progress Fill */}
        <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-brand-600 transition-all duration-500 ease-in-out -z-10 rounded-full shadow-sm shadow-brand-500/20"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <button
              key={index}
              onClick={() => onStepClick(index)}
              className="flex flex-col items-center justify-center bg-transparent border-0 focus:outline-none cursor-pointer group"
            >
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isActive ? 'border-brand-600 bg-brand-600 text-white shadow-lg scale-110' : ''}
                  ${isCompleted ? 'border-brand-600 bg-white dark:bg-gray-900 text-brand-600' : ''}
                  ${!isActive && !isCompleted ? 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400' : ''}
                `}
              >
                <Icon size={18} />
              </div>
              <span 
                className={`
                  mt-2 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 hidden sm:block
                  ${isActive ? 'text-brand-600' : 'text-gray-400 dark:text-gray-500'}
                `}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(StepIndicator);
