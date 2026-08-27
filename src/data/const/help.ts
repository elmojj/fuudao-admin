/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import { SidebarMenuType } from '../sidebar-menu-data';

export const HELP = {
  totalFlow: '昨日与今日的瞬时总供水量',
  deviceScore:
    '综合考虑设备昨日数据的完整率、及时率及可靠度（数据波动与数据一致性）来对设备进行评估。这个分数是所有参与评估的设备的总分，设备清单可以点击设备评估评估场景',
  modelScore:
    '综合考虑模型昨日模拟结果的平均误差、误差波动及纳什系数来对模型模拟的效果进行评估。这个分数是所有参与评估的监测量的模拟总分，监测量清单可以点击模拟评估场景',
  simulationDashboard:
    '这个分数是以下列表中监测量的模拟总分数，列表中的监测量随筛选条件变化',
  plantFlowStandard:
    '出厂流量多时段相对误差均值(δ)控制在 %t 范围内的个数占总数的 %t % 以上',
  networkFlowStandard: `符合经济流速的输配水干管，其流量校核点多时段相对误差均值控制在 %t 范围内的个数占总数的 %t % 以上`,
  pressureStandard: `压力校核点多时段绝对误差均值控制在 %t 范围内的个数应占总数的 %t % 以上，控制在 %t 范围内的个数应占总数的 %t % 以上`,
  chlorineStandard: `水质校核点游离氯(或总氯)浓度多时段相对误差均值控制在 %t 范围内的个数应占总数的 %t %以上`,
  deviceDashboard:
    '这个分数是以下列表中设备的总评估分数，列表中的设备随筛选条件变化',
  [SidebarMenuType.VALVE_ANALYSIS]:
    '根据时间轴的当前时刻模拟一处或多处阀门关闭，并展示受影响的小区及用户，流向反向的管道。可转至综合调度进一步分析',
  [SidebarMenuType.BURST_PIPE_FLUSHING]:
    '根据时间轴的当前时刻模拟一处管道爆管或冲洗，并展示受影响的小区及用户，流向反向的管道。可转至综合调度进一步分析',
  [SidebarMenuType.SCHEDULING_ANALYSIS]:
    '根据时间轴的当前时刻模拟水厂与泵站的调度方案并展示受影响的小区及用户，流向反向的管道',
  [SidebarMenuType.SIMULATION_LOG]:
    '查看系统各时刻的取值正常情况与计算延时情况',
  [SidebarMenuType.SMART_VALVE_MANAGEMENT]:
    '将阀门设置为智慧阀门，智慧阀门在线计算中会根据关联设备的监测量的模拟精度自动调整开度',
  [SidebarMenuType.VALVE_MANAGEMENT]: '查询阀门状态变更',
  [SidebarMenuType.DEVICE_EVALUATION]: '设备数据的完整性与及时性详细与统计展示',
  [SidebarMenuType.DOWNSTREAM_TRACKING]:
    '往下游追踪选中的管道或者流量计，查看它们本身的流量能够流向何处。类似单水源追踪的算法',
  [SidebarMenuType.UPSTREAM_TRACKING]:
    '往上游追踪选中的管道或者监测设备，查看它们本身的流量是主要从哪个水源过来。主供水路径追踪算法',
  [SidebarMenuType.POLLUTION_SOURCE_TRACING]:
    '选中污染点和未污染点，通过上游追踪的交集，查看污染源、已经被污染、未污染的区域',
  [SidebarMenuType.CUSTOM_TRACKING]: `常规上下游追踪，支持限制最小管径和最小流量`,
};

export type HelpKeysType = keyof typeof HELP;

export const getHelpDescription = (
  key: HelpKeysType,
  ...args: string[]
): string => {
  let text = HELP[key] ?? '无';

  if (Array.isArray(args) && args.length > 0) {
    args.forEach((t: string) => {
      text = text.replace('%t', t);
    });
  }
  return text;
};

export const getHelpDescriptionByConfig = (
  content: string,
  ...args: string[]
): string => {
  let text = content;

  if (Array.isArray(args) && args.length > 0) {
    args.forEach((t: string) => {
      text = text.replace('%t', t);
    });
  }
  return text;
};
