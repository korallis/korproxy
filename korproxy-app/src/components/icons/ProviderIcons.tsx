import * as React from 'react'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export const GeminiIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <defs>
      <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="50%" stopColor="#9B72CB" />
        <stop offset="100%" stopColor="#D96570" />
      </linearGradient>
    </defs>
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
      fill="url(#gemini-gradient)"
    />
    <path
      d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
      fill="url(#gemini-gradient)"
    />
    <circle cx="12" cy="12" r="2" fill="url(#gemini-gradient)" />
  </svg>
)

export const ClaudeIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <defs>
      <linearGradient id="claude-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D97757" />
        <stop offset="100%" stopColor="#CC785C" />
      </linearGradient>
    </defs>
    <path
      d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18l6.63 3.68L12 11.54 5.37 7.86 12 4.18zM5 9.18l6 3.33v6.31l-6-3.33V9.18zm8 9.64v-6.31l6-3.33v6.31l-6 3.33z"
      fill="url(#claude-gradient)"
    />
  </svg>
)

export const OpenAIIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681v6.722zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"
      fill="#10A37F"
    />
  </svg>
)

export const QwenIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <defs>
      <linearGradient id="qwen-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#qwen-gradient)" />
    <path
      d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M14 14l3 3"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export const IFlowIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <defs>
      <linearGradient id="iflow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6B7280" />
        <stop offset="100%" stopColor="#9CA3AF" />
      </linearGradient>
    </defs>
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="3"
      fill="url(#iflow-gradient)"
    />
    <path
      d="M7 8h10M7 12h10M7 16h6"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export const providerIconMap: Record<string, React.FC<IconProps>> = {
  gemini: GeminiIcon,
  claude: ClaudeIcon,
  openai: OpenAIIcon,
  codex: OpenAIIcon,
  qwen: QwenIcon,
  iflow: IFlowIcon,
}

export const getProviderIcon = (provider: string): React.FC<IconProps> => {
  return providerIconMap[provider.toLowerCase()] || IFlowIcon
}
