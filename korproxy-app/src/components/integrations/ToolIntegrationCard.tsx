import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ToolIntegration } from '@/types/electron'

interface ToolIntegrationCardProps {
  integration: ToolIntegration
}

export function ToolIntegrationCard({ integration }: ToolIntegrationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!window.korproxy?.tools) return
    
    const result = await window.korproxy.tools.copyConfig(integration.toolId)
    if (result.success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{integration.displayName}</CardTitle>
            <Badge variant={integration.detected ? 'success' : 'secondary'}>
              {integration.detected ? 'Detected' : 'Not Detected'}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? (
              <span className="inline-flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Config
              </span>
            )}
          </Button>
        </div>
        {integration.configPath && (
          <CardDescription className="font-mono text-xs">
            {integration.configPath}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          <svg
            className={`mr-2 h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {expanded ? 'Hide' : 'Show'} Setup Instructions
        </Button>

        {expanded && (
          <div className="space-y-3 rounded-md border bg-muted/50 p-3">
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
              {integration.instructions}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Config Snippet:</div>
              <pre className="overflow-x-auto rounded bg-background p-2 text-xs">
                <code>{integration.configSnippet}</code>
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
