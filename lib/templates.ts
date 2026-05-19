import { NodeType } from './types'

interface TemplateNode {
  _id: string
  label: string
  type: NodeType
  description: string | null
  url: string | null
  color: string | null
  size: number
}

interface TemplateEdge {
  source: string
  target: string
  strength: number
  label: string | null
}

interface TemplateData {
  nodes: TemplateNode[]
  edges: TemplateEdge[]
}

export function getTemplateData(name: 'developer' | 'creative' | 'blank'): TemplateData {
  if (name === 'developer') return developerTemplate
  if (name === 'creative') return creativeTemplate
  return blankTemplate
}

const developerTemplate: TemplateData = {
  nodes: [
    { _id: 'core', label: 'Me', type: 'core', description: 'The center of my map.', url: null, color: null, size: 2 },
    { _id: 'ts', label: 'TypeScript', type: 'skill', description: 'Typed JavaScript at scale.', url: 'https://www.typescriptlang.org', color: null, size: 1.2 },
    { _id: 'react', label: 'React', type: 'skill', description: 'UI component library.', url: 'https://react.dev', color: null, size: 1.2 },
    { _id: 'nextjs', label: 'Next.js', type: 'skill', description: 'Full-stack React framework.', url: 'https://nextjs.org', color: null, size: 1.1 },
    { _id: 'node', label: 'Node.js', type: 'skill', description: 'Server-side JavaScript.', url: 'https://nodejs.org', color: null, size: 1 },
    { _id: 'sql', label: 'SQL', type: 'skill', description: 'Relational data querying.', url: null, color: null, size: 1 },
    { _id: 'git', label: 'Git', type: 'skill', description: 'Version control.', url: null, color: null, size: 0.9 },
    { _id: 'oss', label: 'Open Source', type: 'value', description: 'Building and sharing in the open.', url: null, color: null, size: 1.2 },
    { _id: 'craft', label: 'Craft', type: 'value', description: 'Care for the quality of what I build.', url: null, color: null, size: 1 },
    { _id: 'proj1', label: 'This Project', type: 'project', description: 'My personal 3D identity map.', url: null, color: null, size: 1.1 },
  ],
  edges: [
    { source: 'core', target: 'ts', strength: 0.9, label: null },
    { source: 'core', target: 'react', strength: 0.9, label: null },
    { source: 'core', target: 'oss', strength: 0.8, label: null },
    { source: 'core', target: 'craft', strength: 0.7, label: null },
    { source: 'react', target: 'nextjs', strength: 0.8, label: null },
    { source: 'ts', target: 'nextjs', strength: 0.7, label: null },
    { source: 'node', target: 'sql', strength: 0.5, label: null },
    { source: 'core', target: 'node', strength: 0.7, label: null },
    { source: 'core', target: 'git', strength: 0.6, label: null },
    { source: 'proj1', target: 'nextjs', strength: 0.8, label: null },
    { source: 'proj1', target: 'ts', strength: 0.7, label: null },
    { source: 'oss', target: 'proj1', strength: 0.6, label: null },
  ],
}

const creativeTemplate: TemplateData = {
  nodes: [
    { _id: 'core', label: 'Me', type: 'core', description: 'The center of my map.', url: null, color: null, size: 2 },
    { _id: 'writing', label: 'Writing', type: 'skill', description: 'Crafting words and ideas.', url: null, color: null, size: 1.2 },
    { _id: 'design', label: 'Design', type: 'skill', description: 'Visual communication.', url: null, color: null, size: 1.2 },
    { _id: 'photography', label: 'Photography', type: 'skill', description: 'Capturing moments.', url: null, color: null, size: 1 },
    { _id: 'curiosity', label: 'Curiosity', type: 'value', description: 'Always learning, always questioning.', url: null, color: null, size: 1.2 },
    { _id: 'expression', label: 'Expression', type: 'value', description: 'Turning the inner world outward.', url: null, color: null, size: 1.1 },
    { _id: 'collaboration', label: 'Collaboration', type: 'value', description: 'Creating with others.', url: null, color: null, size: 1 },
    { _id: 'proj1', label: 'Current Work', type: 'project', description: 'What I am making right now.', url: null, color: null, size: 1.1 },
    { _id: 'proj2', label: 'Side Project', type: 'project', description: 'An experiment in progress.', url: null, color: null, size: 1 },
  ],
  edges: [
    { source: 'core', target: 'writing', strength: 0.9, label: null },
    { source: 'core', target: 'design', strength: 0.8, label: null },
    { source: 'core', target: 'curiosity', strength: 0.9, label: null },
    { source: 'core', target: 'expression', strength: 0.8, label: null },
    { source: 'curiosity', target: 'photography', strength: 0.6, label: null },
    { source: 'expression', target: 'writing', strength: 0.7, label: null },
    { source: 'design', target: 'proj1', strength: 0.7, label: null },
    { source: 'writing', target: 'proj2', strength: 0.6, label: null },
    { source: 'collaboration', target: 'proj1', strength: 0.5, label: null },
  ],
}

const blankTemplate: TemplateData = {
  nodes: [
    { _id: 'core', label: 'Me', type: 'core', description: null, url: null, color: null, size: 2 },
  ],
  edges: [],
}
