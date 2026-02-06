export interface Organization {
  account_id: string;
  name: string;
}

export interface UserInfo {
  name: string;
  email: string;
  isAnonymous?: boolean;
}
