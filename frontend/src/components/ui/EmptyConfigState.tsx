import React from 'react';
import { Button } from './Button';
import { Sliders, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyConfigStateProps {
  title: string;
  description: string;
  primaryActionText?: string;
  primaryActionHref?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  icon?: React.ElementType;
}

export const EmptyConfigState: React.FC<EmptyConfigStateProps> = ({
  title,
  description,
  primaryActionText = 'Configure Workflow',
  primaryActionHref,
  onPrimaryAction,
  secondaryActionText = 'Use Industry Template',
  secondaryActionHref,
  onSecondaryAction,
  icon: Icon = Sliders,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-default bg-surface/40 p-8 text-center sm:p-12 space-y-4">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-primary border border-indigo-500/20 shadow-xs">
        <Icon className="size-7" />
      </div>

      <div className="max-w-md space-y-1.5">
        <h3 className="text-base font-bold text-default">{title}</h3>
        <p className="text-xs text-muted leading-relaxed">{description}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {primaryActionHref ? (
          <Link to={primaryActionHref}>
            <Button variant="primary" size="md" className="text-xs shadow-md shadow-indigo-600/20">
              <Sliders className="size-3.5 mr-1.5" />
              {primaryActionText}
            </Button>
          </Link>
        ) : onPrimaryAction ? (
          <Button variant="primary" size="md" onClick={onPrimaryAction} className="text-xs shadow-md shadow-indigo-600/20">
            <Sliders className="size-3.5 mr-1.5" />
            {primaryActionText}
          </Button>
        ) : null}

        {secondaryActionHref ? (
          <Link to={secondaryActionHref}>
            <Button variant="secondary" size="md" className="border border-default text-xs">
              <Sparkles className="size-3.5 mr-1.5 text-amber-500" />
              {secondaryActionText}
            </Button>
          </Link>
        ) : onSecondaryAction ? (
          <Button variant="secondary" size="md" onClick={onSecondaryAction} className="border border-default text-xs">
            <Sparkles className="size-3.5 mr-1.5 text-amber-500" />
            {secondaryActionText}
          </Button>
        ) : null}
      </div>
    </div>
  );
};
