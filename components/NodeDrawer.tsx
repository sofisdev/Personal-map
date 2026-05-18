'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MapNode, NODE_TYPE_COLORS } from '@/lib/types'

interface NodeDrawerProps {
  node: MapNode | null
  onClose: () => void
}

export default function NodeDrawer({ node, onClose }: NodeDrawerProps) {
  const color = node
    ? (node.color ?? NODE_TYPE_COLORS[(node.type as keyof typeof NODE_TYPE_COLORS) ?? 'custom'] ?? '#a78bfa')
    : '#a78bfa'

  return (
    <AnimatePresence>
      {node && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 h-full w-80 z-50 bg-[#0d0d20]/90 backdrop-blur-md border-l border-white/10 p-6 flex flex-col gap-4"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <button
              onClick={onClose}
              className="self-end text-white/40 hover:text-white text-xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>

            <div
              className="w-10 h-10 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}80` }}
            />

            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">{node.type ?? 'node'}</p>
              <h2 className="text-2xl font-semibold">{node.label}</h2>
            </div>

            {node.description && (
              <p className="text-white/70 text-sm leading-relaxed">{node.description}</p>
            )}

            {node.url && (
              <a
                href={node.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
              >
                Open link ↗
              </a>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
