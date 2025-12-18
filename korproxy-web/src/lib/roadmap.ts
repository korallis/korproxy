import fs from 'fs';
import path from 'path';

export interface Feature {
  title: string;
  spec: string;
  completed: boolean;
}

export interface Phase {
  id: string;
  title: string;
  target: string;
  goal: string;
  status: 'planned' | 'in-progress' | 'done';
  features: Feature[];
  successCriteria: string[];
}

export interface Metric {
  metric: string;
  target: string;
  category: string;
}

export interface RoadmapContent {
  vision: string;
  currentState: {
    version: string;
    status: string;
    lastUpdated: string;
  };
  phases: Phase[];
  metrics: Metric[];
}

function parseFeature(line: string): Feature | null {
  const match = line.match(/^- \[([ x])\] (.+?) - `spec: (.+?)`$/);
  if (match) {
    return {
      completed: match[1] === 'x',
      title: match[2].trim(),
      spec: match[3],
    };
  }
  return null;
}

function parseMetrics(content: string): Metric[] {
  const metrics: Metric[] = [];
  const metricsSection = content.match(/## Success Metrics\n\n\|.*\|.*\|.*\|\n\|[-|\s]+\|\n([\s\S]*?)(?=\n---|\n##)/);
  
  if (metricsSection) {
    const rows = metricsSection[1].trim().split('\n');
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        metrics.push({
          metric: cells[0],
          target: cells[1],
          category: cells[2],
        });
      }
    }
  }
  
  return metrics;
}

function determinePhaseStatus(features: Feature[], phaseId: string): 'planned' | 'in-progress' | 'done' {
  const completedCount = features.filter(f => f.completed).length;
  if (completedCount === 0) return 'planned';
  if (completedCount === features.length) return 'done';
  return 'in-progress';
}

export async function getRoadmapContent(): Promise<RoadmapContent> {
  const roadmapPath = path.join(process.cwd(), '..', 'amp-os', 'product', 'roadmap.md');
  
  if (!fs.existsSync(roadmapPath)) {
    return {
      vision: 'Enable developers to seamlessly use their existing AI subscriptions with any AI coding tool.',
      currentState: {
        version: 'Pre-1.0',
        status: 'Active Development',
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      phases: [],
      metrics: [],
    };
  }

  const content = fs.readFileSync(roadmapPath, 'utf8');

  const visionMatch = content.match(/## Vision\n([\s\S]+?)(?=\n##)/);
  const vision = visionMatch ? visionMatch[1].trim() : '';

  const currentStateMatch = content.match(/## Current State\n([\s\S]*?)(?=\n##)/);
  const currentState = {
    version: 'Pre-1.0',
    status: 'Active Development',
    lastUpdated: new Date().toISOString().split('T')[0],
  };
  
  if (currentStateMatch) {
    const versionMatch = currentStateMatch[1].match(/\*\*Version\*\*:\s*(.+)/);
    const statusMatch = currentStateMatch[1].match(/\*\*Status\*\*:\s*(.+)/);
    const updatedMatch = currentStateMatch[1].match(/\*\*Last Updated\*\*:\s*(.+)/);
    
    if (versionMatch) currentState.version = versionMatch[1].trim();
    if (statusMatch) currentState.status = statusMatch[1].trim();
    if (updatedMatch) currentState.lastUpdated = updatedMatch[1].trim();
  }

  const metrics = parseMetrics(content);

  const phases: Phase[] = [];
  const phaseRegex = /### Phase ([A-Z]): (.+?) \(Target: (.+?)\)\n\*\*Goal\*\*: (.+?)\n\n\*\*Features\*\*:\n([\s\S]*?)(?=\*\*Success Criteria\*\*:)([\s\S]*?)(?=\n---|\n###|$)/g;
  
  let match;
  while ((match = phaseRegex.exec(content)) !== null) {
    const [, id, title, target, goal, featuresBlock, criteriaBlock] = match;
    
    const features: Feature[] = [];
    const featureLines = featuresBlock.trim().split('\n');
    for (const line of featureLines) {
      const feature = parseFeature(line);
      if (feature) {
        features.push(feature);
      }
    }

    const successCriteria: string[] = [];
    const criteriaMatch = criteriaBlock.match(/\*\*Success Criteria\*\*:\n([\s\S]*?)(?=\n---|\n###|$)/);
    if (criteriaMatch) {
      const criteriaLines = criteriaMatch[1].trim().split('\n');
      for (const line of criteriaLines) {
        const cleaned = line.replace(/^-\s*/, '').trim();
        if (cleaned) {
          successCriteria.push(cleaned);
        }
      }
    }

    phases.push({
      id: `phase-${id.toLowerCase()}`,
      title: `Phase ${id}: ${title}`,
      target,
      goal,
      status: determinePhaseStatus(features, id),
      features,
      successCriteria,
    });
  }

  return {
    vision,
    currentState,
    phases,
    metrics,
  };
}
