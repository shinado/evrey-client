// 集中导入和导出图标
import TelegramIcon from '../../assets/home/telegram.svg';
import XIcon from '../../assets/home/x.svg';
import MediumIcon from '../../assets/home/medium.svg';
import YoutubeIcon from '../../assets/home/youtube.svg';
import CloseIcon from '../../assets/modal/close.svg';
import SettingIcon from '../../assets/modal/setting.svg';
import SolanaIcon from '../../assets/crypto/SOL.svg';
import ScanIcon from '../../assets/crypto/scan.svg';
import AddressTableIcon from '../../assets/crypto/addressTable.svg';
import USDTIcon from '../../assets/crypto/usdt_logo.svg';
import BackIcon from '../../assets/userSettings/iconBack.svg';
import PlusIcon from '../../assets/holdings/plus.svg';
import TransferIcon from '../../assets/holdings/transfer.svg';
import CashoutIcon from '../../assets/holdings/cashout.svg';
import ShareIcon from '../../assets/info/share.svg';
import StarOutline from "../../assets/info/star-outline.svg";
import Star from "../../assets/info/star.svg";

// Rebate 相关图片
import IconMore from '../../assets/rebate/icon_more.svg';
import Rank1 from '../../assets/rebate/rank_1.svg';
import Rank2 from '../../assets/rebate/rank_2.svg';
import Rank3 from '../../assets/rebate/rank_3.svg';
import IconCopy from '../../assets/rebate/icon_copy.svg';
import IconEdit from '../../assets/rebate/icon_edit.svg';

// Rebate 相关图片资源
const backgroundImage = require('../../assets/rebate/rebate_header_bg.png');
const infoTitleImage = require('../../assets/rebate/info_title_image.png');
const RankAvatar1 = require('../../assets/rebate/rank_1_avatar.png');
const RankAvatar2 = require('../../assets/rebate/rank_2_avatar.png');
const RankAvatar3 = require('../../assets/rebate/rank_3_avatar.png');
const DefaultAvatar = require('../../assets/common/avatar.png');

// 导出单个图标以便在其他地方使用


// 定义顶部图标和链接数组
export const topIcons = [
  { 
    icon: TelegramIcon, 
    label: 'Telegram',
    url: 'https://t.me/aiboxfun'
  },
  { 
    icon: XIcon, 
    label: 'X',
    url: 'https://x.com/aibox_meme'
  },
  // { 
  //   icon: BookmarkIcon, 
  //   label: 'Gitbook',
  //   url: 'https://bills-organization-10.gitbook.io/aibox.whitepaper'
  // },
  { 
    icon: MediumIcon, 
    label: 'Medium',
    url: 'https://medium.com/@momoverse927'
  },
  { 
    icon: YoutubeIcon, 
    label: 'Youtube',
    url: 'https://www.youtube.com/@AiBox_meme'
  },
];

export {
  CloseIcon,
  SettingIcon,
  SolanaIcon,
  ScanIcon,
  AddressTableIcon,
  USDTIcon,
  BackIcon,
  PlusIcon,
  TransferIcon,
  CashoutIcon,
  ShareIcon,
  StarOutline,
  Star,
  IconMore,
  Rank1,
  Rank2,
  Rank3,
  IconCopy,
  IconEdit,
  backgroundImage,
  infoTitleImage,
  RankAvatar1,
  RankAvatar2,
  RankAvatar3,
  DefaultAvatar,
};
