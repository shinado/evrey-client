import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import NumberKeyboard from "./NumberKeyboard";
import i18n from "../i18n";
import { useToast } from "../contexts/ToastContext";
import { Theme } from "src/constants/Theme";

interface VerificationCodeInputProps {
  length?: number;
  onSubmit: (code: string) => void;
  onResend: () => Promise<void>;
  title?: string;
  subtitle?: string;
  resendCountdown?: number;
  loading?: boolean;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  length = 6,
  onSubmit,
  onResend,
  title,
  subtitle,
  resendCountdown = 60,
  loading = false,
}) => {
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(resendCountdown);
  const [canResend, setCanResend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleNumberPress = (num: string) => {
    if (loading || isSubmitting) return;
    if (num === "⌫") {
      setCode((prev) => prev.slice(0, -1));
      return;
    }
    const newCode = code + num;
    if (newCode.length <= length) {
      setCode(newCode);
      if (newCode.length === length) {
        setIsSubmitting(true);
        showToast("processing", {message: i18n.t("verification.verifying"), yPosition: '50%'}, 2000, "simple");
        Promise.resolve(onSubmit(newCode))
          .catch(() => {
            // 只在验证失败时重置提交状态
            setIsSubmitting(false);
            // 延迟清除输入框，等待错误提示消失
            setTimeout(() => {
              setCode("");
            }, 2000);
          });
      }
    }
  };

  const handleResend = async () => {
    if (!canResend || loading || isSubmitting) return;
    await onResend();
    setCountdown(resendCountdown);
    setCanResend(false);
    setCode("");
  };

  // 监听 loading 状态变化
  useEffect(() => {
    if (!loading) {
      setIsSubmitting(false);
    }
  }, [loading]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.topContent}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={[styles.codeContainer, (loading || isSubmitting) && styles.codeContainerDisabled]}>
          {[...Array(length)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.codeBox, 
                (loading || isSubmitting) && styles.codeBoxDisabled,
                i === code.length && !(loading || isSubmitting) && styles.codeBoxActive
              ]}
            >
              <Text style={[styles.codeText, (loading || isSubmitting) && styles.codeTextDisabled]}>
                {code[i] || ""}
              </Text>
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={handleResend} disabled={!canResend || loading || isSubmitting} style={styles.resendButton}>
          <Text style={[styles.resendText, (!canResend || loading || isSubmitting) && styles.resendTextDisabled]}>
            {canResend
              ? i18n.t("verification.resend.button")
              : i18n.t("verification.resend.countdown", { seconds: countdown })}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.keyboardContainer}>
        <NumberKeyboard onNumberPress={handleNumberPress} disabled={loading || isSubmitting} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  topContent: {
    width: "100%",
    alignItems: "center",
  },
  keyboardContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#444",
    marginBottom: 16,
    textAlign: "center",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  codeBox: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  codeBoxActive: {
    borderColor: Theme.primary,
    borderWidth: 2,
    backgroundColor: Theme.background[50],
  },
  codeText: {
    fontSize: 24,
    color: "#222",
    textAlign: "center",
    lineHeight: 24,
    height: 24,
  },
  resendButton: {
    marginBottom: 24,
  },
  resendText: {
    color: Theme.primary,
    fontSize: 18,
  },
  resendTextDisabled: {
    color: "#bbb",
  },
  codeContainerDisabled: {
    opacity: 0.5,
  },
  codeBoxDisabled: {
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
  },
  codeTextDisabled: {
    color: "#999",
  },
});

export default VerificationCodeInput; 