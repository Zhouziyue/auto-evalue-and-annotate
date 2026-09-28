import { useState } from 'react'
import { ChevronRight, ChevronDown, FileText, FileJson, FileCode, FolderOpen, Folder, Plus, Trash2 } from 'lucide-react'
import { Button } from './ui/button'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  fileType?: string
  size?: number
  id?: string
  children?: FileNode[]
}

interface SkillFileTreeProps {
  tree: FileNode[]
  selectedPath: string | null
  onSelectFile: (node: FileNode) => void
  onAddFile?: () => void
  onDeleteFile?: (node: FileNode) => void
}

function getFileIcon(fileType?: string) {
  switch (fileType) {
    case 'json': return <FileJson className="h-4 w-4 text-yellow-500" />
    case 'javascript': return <FileCode className="h-4 w-4 text-blue-500" />
    case 'python': return <FileCode className="h-4 w-4 text-green-500" />
    case 'yaml': return <FileText className="h-4 w-4 text-purple-500" />
    default: return <FileText className="h-4 w-4 text-muted-foreground" />
  }
}

function TreeNode({
  node,
  depth,
  selectedPath,
  onSelectFile,
  onDeleteFile,
}: {
  node: FileNode
  depth: number
  selectedPath: string | null
  onSelectFile: (node: FileNode) => void
  onDeleteFile?: (node: FileNode) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const isDirectory = node.type === 'directory'
  const isSelected = selectedPath === node.path

  const handleClick = () => {
    if (isDirectory) {
      setExpanded(!expanded)
    } else {
      onSelectFile(node)
    }
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded px-2 py-1 text-sm cursor-pointer hover:bg-muted/50 transition-colors ${
          isSelected ? 'bg-muted font-medium' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {isDirectory ? (
          <>
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            {expanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500 shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            {getFileIcon(node.fileType)}
          </>
        )}
        <span className="truncate flex-1">{node.name}</span>
        {!isDirectory && onDeleteFile && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); onDeleteFile(node) }}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        )}
      </div>
      {isDirectory && expanded && node.children && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode
              key={child.path || i}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SkillFileTree({
  tree,
  selectedPath,
  onSelectFile,
  onAddFile,
  onDeleteFile,
}: SkillFileTreeProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">文件</span>
        {onAddFile && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onAddFile}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto py-1">
        {tree.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            暂无文件
          </div>
        ) : (
          tree.map((node, i) => (
            <TreeNode
              key={node.path || i}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
            />
          ))
        )}
      </div>
    </div>
  )
}
