export interface UserInfoData {
  id: string;
  username: string;
  avatar?: string;
  email?: string;
  nickname?: string;
  bio?: string;
  followers: number;
  isFollowing: boolean;
  wallet: string;
  invitationCode?: string;
  registerAt?: string;
  referralId?: string;
  referralCode?: string;
}
