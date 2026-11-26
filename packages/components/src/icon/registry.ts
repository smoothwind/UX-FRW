import data from './registry.json'

export type IconCategory = 'obj' | 'act' | 'st'

export interface IconEntry {
  category: IconCategory
  /** 唯一语义描述——iconId ↔ 语义一对一（红线 13，check-icons 校验） */
  semantic: string
  paths: string[]
  /**
   * 实心态变体（2026-11-26）：true = paths 以 evenodd 填充渲染（fill=currentColor、
   * stroke=none），字形挖空靠复合路径负空间；缺省 = 既有描边渲染，零影响。
   * 语义带「（选中态实心）」后缀注册——同义双形红线 13 的状态后缀豁免口径见 §6.3
   */
  fill?: boolean
}

export const iconRegistry = data as Record<string, IconEntry>

export type IconId = keyof typeof data

export const iconIds = Object.keys(iconRegistry) as IconId[]

export function getIcon(id: IconId): IconEntry {
  const entry = iconRegistry[id]
  if (!entry) throw new Error(`[UxIcon] 未注册的图标 id: ${id}`)
  return entry
}
