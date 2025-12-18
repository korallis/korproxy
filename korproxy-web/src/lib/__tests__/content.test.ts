import { describe, it, expect } from 'vitest'

interface PostFrontmatter {
  title: string
  description: string
  date: string
  author: string
}

interface Post {
  slug: string
  frontmatter: PostFrontmatter
  content: string
  readingTime: string
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/, '')
}

function filterMdxFiles(files: string[]): string[] {
  return files.filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
}

function sortPostsByDate(posts: Post[]): Post[] {
  return posts.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date)
    const dateB = new Date(b.frontmatter.date)
    return dateB.getTime() - dateA.getTime()
  })
}

function estimateReadingTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}

describe('Content Functions', () => {
  describe('slugFromFilename', () => {
    it('should remove .mdx extension', () => {
      expect(slugFromFilename('my-post.mdx')).toBe('my-post')
    })

    it('should remove .md extension', () => {
      expect(slugFromFilename('another-post.md')).toBe('another-post')
    })

    it('should handle filename without extension', () => {
      expect(slugFromFilename('no-extension')).toBe('no-extension')
    })

    it('should preserve other dots in filename', () => {
      expect(slugFromFilename('post.v2.0.mdx')).toBe('post.v2.0')
    })
  })

  describe('filterMdxFiles', () => {
    it('should filter only .mdx and .md files', () => {
      const files = ['post.mdx', 'guide.md', 'image.png', 'style.css', 'notes.txt']
      const result = filterMdxFiles(files)
      expect(result).toEqual(['post.mdx', 'guide.md'])
    })

    it('should return empty array when no mdx files', () => {
      const files = ['image.png', 'data.json']
      const result = filterMdxFiles(files)
      expect(result).toEqual([])
    })

    it('should handle empty input', () => {
      expect(filterMdxFiles([])).toEqual([])
    })

    it('should not match .mdx in middle of filename', () => {
      const files = ['mdx-post.txt', 'post.mdx']
      const result = filterMdxFiles(files)
      expect(result).toEqual(['post.mdx'])
    })
  })

  describe('sortPostsByDate', () => {
    it('should sort posts by date descending (newest first)', () => {
      const posts: Post[] = [
        {
          slug: 'old',
          frontmatter: { title: 'Old', description: '', date: '2024-01-01', author: 'A' },
          content: '',
          readingTime: '1 min',
        },
        {
          slug: 'newest',
          frontmatter: { title: 'Newest', description: '', date: '2024-12-15', author: 'B' },
          content: '',
          readingTime: '1 min',
        },
        {
          slug: 'middle',
          frontmatter: { title: 'Middle', description: '', date: '2024-06-15', author: 'C' },
          content: '',
          readingTime: '1 min',
        },
      ]

      const sorted = sortPostsByDate(posts)
      expect(sorted[0].slug).toBe('newest')
      expect(sorted[1].slug).toBe('middle')
      expect(sorted[2].slug).toBe('old')
    })

    it('should handle posts with same date', () => {
      const posts: Post[] = [
        {
          slug: 'a',
          frontmatter: { title: 'A', description: '', date: '2024-06-15', author: 'X' },
          content: '',
          readingTime: '1 min',
        },
        {
          slug: 'b',
          frontmatter: { title: 'B', description: '', date: '2024-06-15', author: 'Y' },
          content: '',
          readingTime: '1 min',
        },
      ]

      const sorted = sortPostsByDate(posts)
      expect(sorted.length).toBe(2)
    })

    it('should handle empty array', () => {
      expect(sortPostsByDate([])).toEqual([])
    })

    it('should handle single post', () => {
      const posts: Post[] = [
        {
          slug: 'only',
          frontmatter: { title: 'Only', description: '', date: '2024-01-01', author: 'A' },
          content: '',
          readingTime: '1 min',
        },
      ]
      const sorted = sortPostsByDate(posts)
      expect(sorted.length).toBe(1)
      expect(sorted[0].slug).toBe('only')
    })
  })

  describe('estimateReadingTime', () => {
    it('should estimate reading time for short content', () => {
      const content = 'Hello world this is a short post.'
      const result = estimateReadingTime(content)
      expect(result).toBe('1 min read')
    })

    it('should estimate reading time for longer content', () => {
      const content = 'word '.repeat(400) // 400 words ~ 2 minutes
      const result = estimateReadingTime(content)
      expect(result).toBe('2 min read')
    })

    it('should round up reading time', () => {
      const content = 'word '.repeat(250) // 250 words ~ 1.25 minutes -> 2 min
      const result = estimateReadingTime(content)
      expect(result).toBe('2 min read')
    })

    it('should handle empty content', () => {
      const result = estimateReadingTime('')
      expect(result).toBe('1 min read')
    })

    it('should handle content with multiple spaces', () => {
      const content = 'word   word    word'
      const result = estimateReadingTime(content)
      expect(result).toBe('1 min read')
    })
  })
})
