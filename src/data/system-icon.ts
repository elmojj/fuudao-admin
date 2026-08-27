export enum SystemIconType {
  warnFlow = 'WARN_FLOW',
  menuIcon = 'MENU_ICON',
}

export interface SystemIconData {
  fileType: SystemIconType;
  uuid: string;
  fileName: string;
}

export const getSystemIconTypeName = (type: SystemIconType): string => {
  switch (type) {
    case SystemIconType.warnFlow:
      return '警告流程';
    case SystemIconType.menuIcon:
      return '系统图标';
    default:
      return type;
  }
};

export const systemIconOptions: {
  label: string;
  value: SystemIconType;
}[] = Object.values(SystemIconType).map((key) => ({
  label: getSystemIconTypeName(key),
  value: key,
}));
