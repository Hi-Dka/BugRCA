/**
 * Bug 列表项实体
 */
export interface ZenTaoBugListItem {
  id: number;
  title: string;
}

/**
 * Bug 列表接口返回载荷
 */
export interface ZenTaoBugListData {
  bugs: ZenTaoBugListItem[];
}

/**
 * 附件信息（用于日志、音视频等附件下载与分析）
 */
export interface ZenTaoBugFile {
  id: number;
  title: string;
  name: string;
  extension: string;
  size: number;
  url: string;
  webPath?: string;
  realPath?: string;
  addedBy?: string;
  addedDate?: string;
}

/**
 * 历史属性变更明细
 */
export interface ZenTaoBugActionHistory {
  field: string;
  old: string;
  oldValue: string;
  new: string;
  newValue: string;
  diff?: string;
}

/**
 * Bug 流转操作记录与分析线索
 */
export interface ZenTaoBugAction {
  id: number;
  actor: string;
  action: string;
  date: string;
  comment: string;
  history: ZenTaoBugActionHistory[];
}

/**
 * Bug 核心主体（面向 RCA 分析）
 */
export interface ZenTaoBugDetail {
  id: number;
  title: string;
  status: string;
  steps: string;
  openedBy?: string;
  openedDate?: string;
  assignedTo?: string;
  /**
   * 附件列表映射表（无附件时 ZenTao 可能返回空数组或空对象）
   */
  files: Record<string, ZenTaoBugFile> | [];
}

/**
 * Bug 详情接口返回载荷
 */
export interface ZenTaoBugDetailData {
  bug: ZenTaoBugDetail;
  actions: ZenTaoBugAction[];
}
