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
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Check,
  GraduationCap,
} from 'lucide-react';

export const InteractiveTutorialWorkspace: React.FC = () => {
  const {
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl border border-default bg-linear-to-r from-indigo-500/10 via-primary/5 to-emerald-500/10 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20 shrink-0">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-default">
                  Interactive ERP Academy & System Tour
                </h1>
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold font-mono text-primary">
                  {completedSteps.length}/{TUTORIAL_STEPS.length} Completed ({progressPercent}%)
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                Learn how the platform orchestrates manufacturing, inventory, sales, POS, and accounting through guided simulations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetProgress}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-default px-3 py-1.5 rounded-xl border border-default bg-surface hover:bg-surface-sunken transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset Progress</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted">
            <span>Overall Curriculum Mastery</span>
            <span className="font-mono font-bold text-default">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface border border-default">
            <div
              className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${Math.max(3, progressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {(
          [
            { id: 'all', label: 'All Modules (13)' },
            { id: 'admin', label: 'Admin & Setup' },
            { id: 'factory', label: 'Factory & Production' },
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
              'rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 border',
              roleFilter === filter.id
                ? 'bg-primary text-white border-primary shadow-xs font-bold'
                : 'border-default bg-surface text-muted hover:text-default hover:bg-surface-sunken'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Master 2-Column Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Navigation Rail (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="rounded-2xl border border-default bg-surface p-3 space-y-1.5 shadow-2xs">
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted">
              Course Modules
            </div>
            <div className="space-y-1">
              {filteredSteps.map((step) => {
                const isActive = activeStep === step.id;
                const isDone = completedSteps.includes(step.id);
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={cn(
                      'w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer text-xs border',
                      isActive
                        ? 'bg-primary/10 border-primary/40 text-default font-bold shadow-xs'
                        : 'border-transparent hover:bg-surface-sunken text-muted hover:text-default'
                    )}
                  >
                    <div className="pt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <Circle className="size-4 text-muted/50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 text-[10px] text-muted">
                        <span className="font-mono">Step {step.id}</span>
                        <span>{step.estimatedMinutes} min</span>
                      </div>
                      <div className="font-medium text-default leading-snug mt-0.5 truncate">
                        {step.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Details & Interactive Sandbox (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl border border-default bg-surface p-6 shadow-xs space-y-6">
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-default">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    Module {currentStep.id} of {TUTORIAL_STEPS.length}
                  </span>
                  <span className="text-xs text-muted">⏱️ {currentStep.estimatedMinutes} min lesson</span>
                </div>
                <h2 className="text-xl font-bold text-default">{currentStep.title}</h2>
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
                  onClick={() => navigate(currentStep.targetRoute)}
                  className="text-xs gap-1.5 shadow-sm"
                >
                  <span>{currentStep.routeLabel}</span>
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Overview Card */}
            <div className="rounded-2xl border border-default bg-surface-sunken p-5 space-y-2">
              <div className="text-xs font-bold text-default flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span>Operational Architecture</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">{currentStep.overview}</p>
            </div>

            {/* Visual Workflow Pipeline */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted">
                Workflow Pipeline
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentStep.pipeline.map((node, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-2xl border border-default bg-surface p-3.5 shadow-2xs"
                  >
                    <div className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary font-mono font-bold text-xs shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-default">{node.label}</div>
                      <div className="text-[11px] text-muted leading-tight mt-0.5">{node.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Simulator Component */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                <span>Interactive Learning Sandbox</span>
                <span className="text-xs text-primary font-normal">Live test mode</span>
              </div>

              {currentStep.interactiveType === 'bom_calculator' && <BomCalculatorSimulator />}
              {currentStep.interactiveType === 'qc_inspector' && <QcInspectorSimulator />}
              {currentStep.interactiveType === 'pos_checkout' && <PosCheckoutSimulator />}
              {currentStep.interactiveType === 'courier_dispatch' && <CourierDispatchSimulator />}
              {currentStep.interactiveType !== 'bom_calculator' &&
                currentStep.interactiveType !== 'qc_inspector' &&
                currentStep.interactiveType !== 'pos_checkout' &&
                currentStep.interactiveType !== 'courier_dispatch' && (
                  <div className="rounded-2xl border border-dashed border-default p-6 text-center space-y-3">
                    <p className="text-xs text-muted">
                      Ready to experience this module in live action with real enterprise data?
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(currentStep.targetRoute)}
                      className="text-xs gap-1.5"
                    >
                      <span>Launch {currentStep.routeLabel}</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                )}
            </div>

            {/* Key Operating Rules */}
            <div className="space-y-3 pt-3 border-t border-default">
              <div className="text-xs font-bold uppercase tracking-wider text-muted">
                Key Operating Rules
              </div>
              <ul className="space-y-2 text-xs text-muted">
                {currentStep.keyTakeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-5 border-t border-default">
              <button
                type="button"
                onClick={prevStep}
                disabled={activeStep <= 1}
                className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-default disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowLeft className="size-4" />
                <span>Previous Step</span>
              </button>

              <div className="text-xs text-muted font-mono">
                Step {activeStep} of {TUTORIAL_STEPS.length}
              </div>

              <button
                type="button"
                onClick={nextStep}
                disabled={activeStep >= TUTORIAL_STEPS.length}
                className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next Step</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InteractiveTutorialWorkspace;
