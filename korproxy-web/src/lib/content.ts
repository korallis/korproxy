import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const contentDirectory = path.join(process.cwd(), 'content');

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  author: string;
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  readingTime: string;
}

export interface ChangelogEntry {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
}

export function getAllPosts(): Post[] {
  const blogDirectory = path.join(contentDirectory, 'blog');
  
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  const files = fs.readdirSync(blogDirectory);
  const mdxFiles = files.filter((file) => file.endsWith('.mdx') || file.endsWith('.md'));

  const posts = mdxFiles.map((filename) => {
    const slug = filename.replace(/\.mdx?$/, '');
    const filePath = path.join(blogDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    const stats = readingTime(content);

    return {
      slug,
      frontmatter: data as PostFrontmatter,
      content,
      readingTime: stats.text,
    };
  });

  return posts.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date);
    const dateB = new Date(b.frontmatter.date);
    return dateB.getTime() - dateA.getTime();
  });
}

export function getPostBySlug(slug: string): Post | null {
  const blogDirectory = path.join(contentDirectory, 'blog');
  
  const mdxPath = path.join(blogDirectory, `${slug}.mdx`);
  const mdPath = path.join(blogDirectory, `${slug}.md`);
  
  let filePath: string | null = null;
  
  if (fs.existsSync(mdxPath)) {
    filePath = mdxPath;
  } else if (fs.existsSync(mdPath)) {
    filePath = mdPath;
  }
  
  if (!filePath) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const stats = readingTime(content);

  return {
    slug,
    frontmatter: data as PostFrontmatter,
    content,
    readingTime: stats.text,
  };
}

export function getChangelog(): ChangelogEntry[] {
  const changelogDirectory = path.join(contentDirectory, 'changelog');
  
  if (!fs.existsSync(changelogDirectory)) {
    return [];
  }

  const files = fs.readdirSync(changelogDirectory);
  const mdxFiles = files.filter((file) => file.endsWith('.mdx') || file.endsWith('.md'));

  const entries = mdxFiles.map((filename) => {
    const slug = filename.replace(/\.mdx?$/, '');
    const filePath = path.join(changelogDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      frontmatter: data as PostFrontmatter,
      content,
    };
  });

  return entries.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date);
    const dateB = new Date(b.frontmatter.date);
    return dateB.getTime() - dateA.getTime();
  });
}
