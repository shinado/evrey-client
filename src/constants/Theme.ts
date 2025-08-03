import { Colors } from "./Colors";

export const Theme = {
  // 主题色
  primary: "#53B190",      // 主色 绿色
  secondary: "#FF3662",    // 辅助色 红色
  accent: "#FFC16A",       // 点缀色 黄色
  blue: "#459BF8",         // 蓝色
  gray: "#F2F3F2",         // 灰色
  // 边框和底色
  border: "#E8E8EA",       // 边框色
  backgroundColor: "#F2F3F2",   // 底色

  // 其他
  brand: {
    primary: "#53B190",
    secondary: "#D5CDFF", // 插画辅助色（如无可删）
  },

  // 旧版兼容（可选，建议逐步替换为上面新结构）
  primaryColors: "#53B190",
  secondaryColors: "#FF3662",
  accentColors: "#FFC16A",
  textColors: {
    300: "#181725",
    200: "#999999",
  },
  borderColor: "#E8E8EA",
  WINDOW_BACKGROUND_COLOR: Colors.stone["100"],
  primaryBlackColors: Colors.black,
  primaryWhiteColors: Colors.white,
  grayColors: Colors.gray,
  background:{
    50:"#FFFFFF", // 主背景
    100:"#F7F8FA", // 卡片背景
    200:"#FBFBFC", // 输入框选中颜色
    300:"#E2E4E8", // 输入框/分割线
    400:"#DBDCE0", // 按钮灰态 图标背景 
  },
  text:{
    300:"#000000", // 主文字
    200:"#4C4D50", // 次要文字
    100:"#717277", // 主要内容
    50:"#BBBCC0", // 注释文案/灰显
  },
  //上涨
  ascend:"#3ABC6A",
  //下跌
  descend:"#E94581",  
};
