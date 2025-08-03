import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
  Clipboard,
  Alert
} from "react-native";

interface PinCodeInputProps {
  codeLength?: number; // 验证码长度
  onCodeFilled: (code: string) => void; // 验证码填写完成后的回调
  keyboardType?: KeyboardTypeOptions | undefined;
}

export interface PinCodeInputRef {
  clearCode: () => void; // 供外部调用清除验证码的方法
}

const PinCodeInput = forwardRef<PinCodeInputRef, PinCodeInputProps>(
  ({ codeLength = 6, onCodeFilled, keyboardType = "default" }, ref) => {
    // 定义状态，存储每个输入框的值
    const [code, setCode] = useState<string[]>(Array(codeLength).fill(""));
    // 定义状态，存储当前聚焦的输入框索引
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // 存储每个输入框的引用
    const inputs = useRef<TextInput[]>([]);

    // 处理输入框内容变化
    const handleChangeText = (text: string, index: number) => {
      const newCode = [...code];
      newCode[index] = text;

      setCode(newCode);
      if (text && index < codeLength - 1) {
        inputs.current[index + 1].focus();
      }

      if (newCode.every((digit) => digit !== "")) {
        onCodeFilled(newCode.join(""));
        inputs.current[code.length - 1].blur();
      }
    };

    // 处理删除键（Backspace）逻辑
    const handleKeyPress = (event: any, index: number) => {
      if (event.nativeEvent.key === "Backspace" && index > 0 && !code[index]) {
        inputs.current[index - 1].focus();
        setCode((prevCode) => {
          const newCode = [...prevCode];
          newCode[index - 1] = "";
          return newCode;
        });
      }
    };

    // 处理输入框聚焦事件
    const handleFocus = async (index: number) => {
      setFocusedIndex(index); // 设置当前聚焦的输入框索引
    };

    // 处理输入框失焦事件
    const handleBlur = () => {
      setFocusedIndex(null); // 清除聚焦状态
    };

    // 处理粘贴操作
    const handlePaste = (pastedText: string) => {
      const newCode = [...code];
      const pastedDigits = pastedText.split("").slice(0, codeLength); // 只取前 codeLength 个字符

      pastedDigits.forEach((digit, index) => {
        newCode[index] = digit;
      });

      setCode(newCode);
      // 如果所有输入框都已填写，触发回调
      if (newCode.every((digit) => digit !== "")) {
        inputs.current[0].blur();
        onCodeFilled(newCode.join(""));
      }
    };

    // 组件挂载后，默认聚焦第一个输入框
    useEffect(() => {
      if (inputs.current[0]) {
        inputs.current[0].focus();
      }
    }, []);

    // 进入页面时检测剪贴板
    useEffect(() => {
      const checkClipboard = async () => {
        const clipboardContent = await Clipboard.getString();
        if (clipboardContent && clipboardContent.length >= codeLength) {
          Alert.alert(
            "检测到粘贴内容",
            `是否粘贴: ${clipboardContent.slice(0, codeLength)}?`,
            [
              { text: "取消", style: "cancel" },
              { text: "粘贴", onPress: () => handlePaste(clipboardContent) },
            ]
          );
        }
      };

      checkClipboard();
    }, []);

    useImperativeHandle(ref, () => ({
      clearCode: () => {
        setCode(Array(codeLength).fill(""));
      },
    }));
    return (
      <View style={styles.container}>
        {Array.from({ length: codeLength }).map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => ref && (inputs.current[index] = ref)}
            style={[
              styles.input,
              focusedIndex === index && styles.focusedInput,
            ]}
            maxLength={1}
            keyboardType={keyboardType}
            value={code[index]}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(event) => handleKeyPress(event, index)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            selectTextOnFocus
          />
        ))}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
  },
  input: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E4E8",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
    color: "#000000",
    marginHorizontal: 4,
  },
  focusedInput: {
    borderColor: "#4C4D50",
  },
});

export default PinCodeInput;
