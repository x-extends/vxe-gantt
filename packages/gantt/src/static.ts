/**
 * 依赖线枚举类型
 */
export enum VxeGanttDependencyType {
  /**
   * 结束后才开始，表示一个任务必须在另一个任务开始之前完成
   */
  FinishToStart = 0,
  /**
   * 开始到结束，表示从某个过程的开始到结束的整个过程
   */
  StartToFinish = 1,
  /**
   * 开始后才开始，表示一个活动结束了，另一个活动才能开始，它们之间按先后顺序进行
   */
  StartToStart = 2,
  /**
   * 完成到完成，表示一个任务必须在另一个任务完成之后才能完成
   */
  FinishToFinish = 3
}
