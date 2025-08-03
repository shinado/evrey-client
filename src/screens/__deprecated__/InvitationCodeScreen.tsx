import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Theme } from "../../constants/Theme";
import { Button } from "../../components/Button";
import { useNavigation } from "@react-navigation/native";
import i18n from "../../i18n";
import { FontFamily } from "../../constants/typo";
import SvgGradientTextText from "../../components/SvgGradientTextText";
import { useToast } from "../../contexts/ToastContext";
import { inviteService, userService, authService} from "../../services";
import { UserStorage } from "../../storage";
import { NavigationService } from "../../navigation/service";
import { NavigatorName } from "../../constants/navigation";

const extractErrorMessage = (message: string): string => {
  const parts = message.split(":");
  return parts.length > 1 ? parts.slice(1).join(":").trim() : message;
};


const InvitationCodeScreen = ({ route }: { route: any }) => {
  const { pushType = "", onComplete , invitationCode } = route.params;
  const navigation = useNavigation<any>();
  const [value, setValue] = useState("");
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSkip = async () => {
    if (pushType && pushType === "goBack") {
      navigation.goBack();
    } else {
      NavigationService.reset(NavigatorName.MAIN_TAB);
    }
  };

  const handleRequestCode = async () => {
    setIsSubmitting(true);
    try {
      await userService.bindReferrer(value);
      const latestUserInfo = await authService.getUserInfo();
      if (latestUserInfo) {
        await UserStorage.setUserInfo(latestUserInfo);
      }
      if (pushType && pushType === "goBack") {
        if (onComplete) {
          const result = await onComplete();
          if (result) {
            showToast("failed", {message: result});
          } else {
            navigation.goBack();
          }
        } else {
          navigation.goBack();
        }
      } else {
        NavigationService.reset(NavigatorName.MAIN_TAB);
      }
    } catch (error: any) {
      showToast(
        "failed",
        {message: extractErrorMessage(error.message) || i18n.t("profile.errors.updateFailed")}
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const getPendingInvitationCode = async () => {
      if(invitationCode) {
        setValue(invitationCode);
      } else {
        const code = await inviteService.getPendingInvitationCode();
        setValue(code ?? "");
      }
    };
    getPendingInvitationCode();
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.welcomeContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/signIn/invite.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <SvgGradientTextText
            text={i18n.t("signIn.invite")}
          ></SvgGradientTextText>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder={i18n.t("signIn.invite")}
            placeholderTextColor={Theme.text[50]}
            value={value}
            onChangeText={setValue}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            loading={isSubmitting}
            type="primary"
            onPress={handleRequestCode}
            style={styles.submitButton}
          >
            {i18n.t("common.confirm")}
          </Button>
          <Button type="primary" onPress={handleSkip} style={styles.skip}>
            <Text style={styles.skipText}>{i18n.t("common.skip")}</Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background[50],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 90,
    paddingBottom: 24,
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  formContainer: {
    width: "100%",
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#4C4D50",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 85,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    color: "#000000",
    backgroundColor: Theme.background[50],
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: Theme.background[300],
    borderRadius: 9,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: Theme.brand.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Theme.text[50],
    lineHeight: 18,
  },
  link: {
    color: Theme.text[200],
    textDecorationLine: "underline",
    fontFamily: FontFamily.medium,
  },
  submitButton: {
    width: "100%",
  },
  skip: {
    width: "100%",
    marginTop: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000000",
  },
  skipText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default InvitationCodeScreen;
