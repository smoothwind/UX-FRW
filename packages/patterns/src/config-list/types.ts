/** UxConfigList —— 配置目录化编辑器（分组折叠 + facet 多选 + 覆盖状态 + 搜索 + 筛选反馈） */

/** 配置条目：key 为内部标识（次要显示），usage 为用途文案（主标题，红线：可读性优先） */
export interface ConfigListEntry {
  /** 唯一标识（持久化 key，次要显示于 meta 行） */
  key: string
  /** 所属组 id（对应 ConfigListGroup.id） */
  group: string
  /** 用途/影响面文案（主标题；缺省回退 key） */
  usage?: string
  /** 内置默认值（编辑区 placeholder 展示） */
  builtin?: string
  /** 占位符提示（如 {sql}，meta 行 code 胶囊） */
  placeholders?: string[]
  /** facet 值（如数据库种类；facet 筛选激活时未命中者隐藏） */
  facet?: string
  /** 可选徽标文字（facet 筛选激活时自动隐藏，避免同屏冗余） */
  tag?: string
}

/** 分组定义（渲染顺序 = 数组顺序） */
export interface ConfigListGroup {
  id: string
  label: string
}

/** facet 筛选项（多选，空集合 = 全部） */
export interface ConfigListFacet {
  value: string
  label: string
}
