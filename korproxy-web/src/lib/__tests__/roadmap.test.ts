import { describe, it, expect } from 'vitest'

interface Feature {
  title: string
  spec: string
  completed: boolean
}

interface Metric {
  metric: string
  target: string
  category: string
}

function parseFeature(line: string): Feature | null {
  const match = line.match(/^- \[([ x])\] (.+?) - `spec: (.+?)`$/)
  if (match) {
    return {
      completed: match[1] === 'x',
      title: match[2].trim(),
      spec: match[3],
    }
  }
  return null
}

function determinePhaseStatus(
  features: Feature[]
): 'planned' | 'in-progress' | 'done' {
  const completedCount = features.filter((f) => f.completed).length
  if (completedCount === 0) return 'planned'
  if (completedCount === features.length) return 'done'
  return 'in-progress'
}

function parseMetricRow(row: string): Metric | null {
  const cells = row
    .split('|')
    .map((c) => c.trim())
    .filter(Boolean)
  if (cells.length >= 3) {
    return {
      metric: cells[0],
      target: cells[1],
      category: cells[2],
    }
  }
  return null
}

describe('Roadmap Parsing Functions', () => {
  describe('parseFeature', () => {
    it('should parse completed feature', () => {
      const line = '- [x] OAuth Login - `spec: F1`'
      const result = parseFeature(line)
      expect(result).toEqual({
        completed: true,
        title: 'OAuth Login',
        spec: 'F1',
      })
    })

    it('should parse incomplete feature', () => {
      const line = '- [ ] Desktop App - `spec: F2`'
      const result = parseFeature(line)
      expect(result).toEqual({
        completed: false,
        title: 'Desktop App',
        spec: 'F2',
      })
    })

    it('should handle feature with complex title', () => {
      const line = '- [x] Multi-provider OAuth Support (Claude, GPT) - `spec: F3`'
      const result = parseFeature(line)
      expect(result).toEqual({
        completed: true,
        title: 'Multi-provider OAuth Support (Claude, GPT)',
        spec: 'F3',
      })
    })

    it('should return null for invalid format', () => {
      const line = '- Invalid line without spec'
      const result = parseFeature(line)
      expect(result).toBeNull()
    })

    it('should return null for empty line', () => {
      const result = parseFeature('')
      expect(result).toBeNull()
    })

    it('should return null for regular list item', () => {
      const line = '- Just a regular item'
      const result = parseFeature(line)
      expect(result).toBeNull()
    })

    it('should handle feature with dashes in title', () => {
      const line = '- [x] End-to-end testing - `spec: TG9`'
      const result = parseFeature(line)
      expect(result).toEqual({
        completed: true,
        title: 'End-to-end testing',
        spec: 'TG9',
      })
    })
  })

  describe('determinePhaseStatus', () => {
    it('should return planned when no features completed', () => {
      const features: Feature[] = [
        { title: 'A', spec: '1', completed: false },
        { title: 'B', spec: '2', completed: false },
      ]
      expect(determinePhaseStatus(features)).toBe('planned')
    })

    it('should return done when all features completed', () => {
      const features: Feature[] = [
        { title: 'A', spec: '1', completed: true },
        { title: 'B', spec: '2', completed: true },
      ]
      expect(determinePhaseStatus(features)).toBe('done')
    })

    it('should return in-progress when some features completed', () => {
      const features: Feature[] = [
        { title: 'A', spec: '1', completed: true },
        { title: 'B', spec: '2', completed: false },
        { title: 'C', spec: '3', completed: true },
      ]
      expect(determinePhaseStatus(features)).toBe('in-progress')
    })

    it('should return planned for empty features array', () => {
      expect(determinePhaseStatus([])).toBe('planned')
    })

    it('should return done for single completed feature', () => {
      const features: Feature[] = [{ title: 'A', spec: '1', completed: true }]
      expect(determinePhaseStatus(features)).toBe('done')
    })

    it('should return planned for single incomplete feature', () => {
      const features: Feature[] = [{ title: 'A', spec: '1', completed: false }]
      expect(determinePhaseStatus(features)).toBe('planned')
    })
  })

  describe('parseMetricRow', () => {
    it('should parse metric row', () => {
      const row = '| Daily Active Users | 1000 | Engagement |'
      const result = parseMetricRow(row)
      expect(result).toEqual({
        metric: 'Daily Active Users',
        target: '1000',
        category: 'Engagement',
      })
    })

    it('should handle row with extra columns', () => {
      const row = '| Conversion Rate | 5% | Revenue | Extra |'
      const result = parseMetricRow(row)
      expect(result).toEqual({
        metric: 'Conversion Rate',
        target: '5%',
        category: 'Revenue',
      })
    })

    it('should return null for row with insufficient columns', () => {
      const row = '| Only | Two |'
      const result = parseMetricRow(row)
      expect(result).toBeNull()
    })

    it('should return null for empty row', () => {
      const result = parseMetricRow('')
      expect(result).toBeNull()
    })

    it('should trim whitespace from values', () => {
      const row = '|  Metric Name  |  Target Value  |  Category  |'
      const result = parseMetricRow(row)
      expect(result).toEqual({
        metric: 'Metric Name',
        target: 'Target Value',
        category: 'Category',
      })
    })
  })
})
