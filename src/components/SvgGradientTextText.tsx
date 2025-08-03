import React from "react";
import Svg, { Defs, LinearGradient, Stop, Rect, Mask, Text } from "react-native-svg";
import { FontFamily } from "../constants/typo";

const GradientText = ({ text = '', fontSize = 24 ,width = 300 }: { text: string, fontSize?: number, width?: number }) => {
  // 计算 viewBox 的宽度和高度
  const viewBoxWidth = width; // 可以根据需要调整
  const viewBoxHeight = fontSize * 1.5;

  return (
    <Svg 
      height={viewBoxHeight} 
      width="100%" 
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
    >
      <Defs>
        {/* 定义渐变 */}
        <LinearGradient id="grad" x1="0%" y1="50%" x2="100%" y2="50%">
          <Stop offset="0%" stopColor="#717277" stopOpacity="1" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
        </LinearGradient>

        {/* 定义文字遮罩 */}
        <Mask id="mask">
          <Text
            x={viewBoxWidth / 2} // 水平居中
            y={viewBoxHeight / 2} // 垂直居中
            textAnchor="middle" // 水平对齐方式
            alignmentBaseline="middle" // 垂直对齐方式
            fontSize={fontSize}
            fontWeight="bold"
            fontFamily={FontFamily.dingTalk}
            fill="white" // 遮罩文字颜色必须为白色
          >
            {text}
          </Text>
        </Mask>
      </Defs>

      {/* 使用渐变填充的矩形，并通过遮罩显示文字 */}
      <Rect
        x="0"
        y="0"
        width={viewBoxWidth}
        height={viewBoxHeight}
        fill="url(#grad)"
        mask="url(#mask)"
      />
    </Svg>
  );
};

export default GradientText;