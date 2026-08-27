/** 第三方关联信息 */
export interface ExternalUserInfo {
  canLogin?: boolean;
  dept?: string;
  id?: string;
  loginName?: string;
  mobile?: string;
}

export interface UserInfoType {
  userEmail: string;
  userName: string;
  userPhone: string;
  userSex: string;
  departmentId: string;
  departmentName: string;
  externalUserInfo?: ExternalUserInfo;
}

export interface LoginResponse {
  status: 'Success' | 'Fail';
  sessionId?: string;
  errorMessage?: string;
}

export interface CaptchaResponse {
  status: 'Success' | 'Fail';
  url?: string;
  content?: string;
  errorMessage?: string;
}
