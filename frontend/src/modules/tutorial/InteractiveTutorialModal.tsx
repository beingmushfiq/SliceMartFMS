import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTutorialStore, type TutorialRoleFilter } from './tutorialStore';
import { TUTORIAL_STEPS, type TutorialStep } from './tutorialData';
import {
  BomCalculatorSimulator,
  QcInspectorSimulator,
  PosCheckoutSimulator,
  CourierDispatchSimulator,
} from './components/TutorialSimulators';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import {
  X,
  Compass,
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Check,
} from 'lucide-react';

export const InteractiveTutorialModal: React.FC = () => {
  const {
    isOpen,
    closeTutorial,
    activeStep,
    setActiveStep,
    nextStep,
    prevStep,
    completedSteps,
    toggleStepCompleted,
    roleFilter,
    setRoleFilter,
    resetProgress,
  } = useTutorialStore();

  const navigate = useNavigate();

  const filteredSteps = useMemo(() => {
    if (roleFilter === 'all') return TUTORIAL_STEPS;
    return TUTORIAL_STEPS.filter((s) => s.category === roleFilter);
  }, [roleFilter]);

  const currentStep: TutorialStep = useMemo(() => {
    return TUTORIAL_STEPS.find((s) => s.id === activeStep) ?? TUTORIAL_STEPS[0]!;
  }, [activeStep]);

  const progressPercent = Math.round((completedSteps.length / TUTORIAL_STEPS.length) * 100);
  const isCurrentCompleted = completedSteps.includes(currentStep.id);

  if (!isOpen) return null;

  const handleLaunchModule = (route: string) => {
    closeTutorial();
    navigate(route);
  };

  return (
    <div className="fixed inset-0 z-(--z-modal) flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col h-[90vh] max-h-212.5 w-full max-w-5xl rounded-3xl border border-default bg-surface shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-default px-5 py-3.5 bg-surface-raised shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Compass className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-default">
                  Interactive System Guide & Tour
                </h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold font-mono text-primary">
                  {completedSteps.length} / {TUTORIAL_STEPS.length} Completed ({progressPercent}%)
                </span>
              </div>
              <p className="text-[11px] text-muted hidden sm:block">
                End-to-end interactive manual for operations, factory floor, sales, and accounting.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetProgress}
              className="text-[11px] text-muted hover:text-default px-2 py-1 rounded-lg border border-transparent hover:border-default cursor-pointer flex items-center gap-1"
              title="Reset tutorial progress"
            >
              <RotateCcw className="size-3" />
              <span className="hidden md:inline">Reset Progress</span>
            </button>
            <button
              type="button"
              onClick={closeTutorial}
              className="flex size-8 items-center justify-center rounded-xl border border-default text-muted hover:text-default hover:bg-surface-sunken transition-colors cursor-pointer"
              title="Close guide"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="flex items-center gap-1.5 border-b border-default px-5 py-2 bg-surface-sunken overflow-x-auto scrollbar-none shrink-0 text-xs">
          <span className="text-muted font-semibold text-[11px] mr-1 shrink-0">Role Perspective:</span>
          {(
            [
              { id: 'all', label: 'All Modules (13)' },
              { id: 'admin', label: 'Admin & Setup' },
              { id: 'factory', label: 'Factory & Quality' },
              { id: 'inventory', label: 'Warehouse & Stock' },
              { id: 'sales', label: 'Sales & Retail POS' },
              { id: 'finance', label: 'Finance & Accounts' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setRoleFilter(filter.id as TutorialRoleFilter)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0',
                roleFilter === filter.id
                  ? 'bg-surface text-primary shadow-xs border border-default font-bold'
                  : 'text-muted hover:text-default hover:bg-surface/50'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Master Body: Step list on left, Step details on right */}
        <div className="flex flex-1 min-h-0 divide-y sm:divide-y-0 sm:divide-x divide-default flex-col sm:flex-row">
          {/* Step List Sidebar */}
          <div className="w-full sm:w-72 overflow-y-auto p-2.5 space-y-1 shrink-0 max-h-40 sm:max-h-none border-b sm:border-b-0 border-default bg-surface/50">
            {filteredSteps.map((step) => {
              const isActive = activeStep === step.id;
              const isDone = completedSteps.includes(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={cn(
                    'w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer text-xs',
                    isActive
                      ? 'bg-primary/10 border border-primary/30 text-default font-bold shadow-xs'
                      : 'hover:bg-surface-sunken text-muted hover:text-default border border-transparent'
                  )}
                >
                  <div className="pt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (
                      <Circle className="size-4 text-muted/60" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-muted">Step {step.id}</span>
                      <span className="text-[10px] text-muted">{step.estimatedMinutes}m</span>
                    </div>
                    <div className="truncate font-medium text-default leading-tight">
                      {step.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-default">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    Step {currentStep.id} of {TUTORIAL_STEPS.length}
                  </span>
                  <span className="text-xs text-muted">⏱️ {currentStep.estimatedMinutes} min walkthrough</span>
                </div>
                <h3 className="text-lg font-bold text-default">{currentStep.title}</h3>
                <p className="text-xs text-muted">{currentStep.subtitle}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleStepCompleted(currentStep.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                    isCurrentCompleted
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-default bg-surface hover:bg-surface-sunken text-muted hover:text-default'
                  )}
                >
                  {isCurrentCompleted ? (
                    <>
                      <Check className="size-3.5" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <Circle className="size-3.5" />
                      <span>Mark Understood</span>
                    </>
                  )}
                </button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleLaunchModule(currentStep.targetRoute)}
                  className="text-xs gap-1.5 shadow-sm"
                >
                  <span>{currentStep.routeLabel}</span>
                  <ExternalLink className="size-3" />
                </Button>
              </div>
            </div>

            {/* Overview Card */}
            <div className="rounded-2xl border border-default bg-surface-sunken p-4 space-y-2">
              <div className="text-xs font-bold text-default flex items-center gap-2">
                <Sparkles className="size-3.5 text-primary" />
                <span>Operational Concept</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">{currentStep.overview}</p>
            </div>

            {/* Visual Workflow Pipeline */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Workflow Pipeline
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {currentStep.pipeline.map((node, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-default bg-surface p-2.5 shadow-2xs"
                  >
                    <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-default truncate">{node.label}</div>
                      <div className="text-[11px] text-muted leading-tight mt-0.5">{node.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Simulation / Playground if applicable */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                <span>Interactive Learning Sandbox</span>
                <span className="text-[10px] text-primary font-normal">Click & test below</span>
              </div>

              {currentStep.interactiveType === 'bom_calculator' && <BomCalculatorSimulator />}
              {currentStep.interactiveType === 'qc_inspector' && <QcInspectorSimulator />}
              {currentStep.interactiveType === 'pos_checkout' && <PosCheckoutSimulator />}
              {currentStep.interactiveType === 'courier_dispatch' && <CourierDispatchSimulator />}
              {currentStep.interactiveType !== 'bom_calculator' &&
                currentStep.interactiveType !== 'qc_inspector' &&
                currentStep.interactiveType !== 'pos_checkout' &&
                currentStep.interactiveType !== 'courier_dispatch' && (
                  <div className="rounded-2xl border border-dashed border-default p-4 text-center space-y-2">
                    <p className="text-xs text-muted">
                      Ready to experience this module in live action with real workspace data?
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleLaunchModule(currentStep.targetRoute)}
                      className="text-xs gap-1.5"
                    >
                      <span>Launch {currentStep.routeLabel}</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                )}
            </div>

            {/* Key Takeaways */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Key Operating Rules
              </div>
              <ul className="space-y-1.5 text-xs text-muted">
                {currentStep.keyTakeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Navigation */}
        <div className="flex items-center justify-between border-t border-default px-5 py-3 bg-surface-raised shrink-0">
          <button
            type="button"
            onClick={prevStep}
            disabled={activeStep <= 1}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-default disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowLeft className="size-3.5" />
            <span>Previous Step</span>
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs text-muted">
            <span>{activeStep}</span>
            <span>/</span>
            <span>{TUTORIAL_STEPS.length}</span>
          </div>

          <button
            type="button"
            onClick={nextStep}
            disabled={activeStep >= TUTORIAL_STEPS.length}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Next Step</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
