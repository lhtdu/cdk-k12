interface StepIndicatorProps {
  currentStep: number
  labels: string[]
}

export default function StepIndicator({ currentStep, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {[1, 2, 3].map((s, i) => {
        const isActive = s === currentStep
        const isDone = s < currentStep
        const isLast = i === labels.length - 1

        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              {/* Circle */}
              <div className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: isDone ? '#22c55e' : isActive ? '#6366f1' : 'transparent',
                  border: isDone || isActive ? 'none' : '2px solid #2a2d3a',
                  boxShadow: isActive ? '0 0 16px rgba(99,102,241,0.4)' : isDone ? '0 0 12px rgba(34,197,94,0.3)' : 'none',
                }}>
                {isDone ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-600'}`}>{s}</span>
                )}
                {/* Glow ring for active */}
                {isActive && (
                  <span className="absolute inset-0 rounded-full animate-pulse-ring" style={{ border: '2px solid #6366f1', transform: 'scale(1.2)' }} />
                )}
              </div>
              {/* Label */}
              <span className={`text-xs font-medium whitespace-nowrap transition-colors ${isActive ? 'text-accent' : isDone ? 'text-success' : 'text-slate-600'}`}>
                {labels[i]}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className={`h-0.5 w-12 mx-1 mb-5 rounded transition-colors duration-300 ${isDone ? 'bg-success' : 'bg-surface-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
