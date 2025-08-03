import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Theme } from "../../constants/Theme";
import { Button } from "../../components/Button";
import { UserStorage } from "../../storage";
import * as ImagePicker from "expo-image-picker";
import UploadSvg from "../../../assets/common/upload.svg";
import { Image } from "expo-image";
import { uploadService } from "../../services/content/upload";
import i18n from "../../i18n";
import { useToast } from '../../contexts/ToastContext';
import { userService } from "../../services/user/user";
import { UserInfoData } from "../../types";
import { DefaultAvatar } from "../../constants/icons";
import AppBar from "src/components/AppBar";

// 1. 定义表单状态类型
interface ProfileForm {
  nickname: string;
  email: string;
  username: string;
  bio: string;
  avatar: {
    uri: string;
    fileName?: string;
  } | null;
}

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState<UserInfoData | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    nickname: "",
    email: "",
    username: "",
    bio: "",
    avatar: null,
  });
  const [loading, setLoading] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    const loadUserInfo = async () => {
      const info = await UserStorage.getUserInfo();
      setUserInfo(info);
      setForm({
        nickname: info?.nickname || "",
        email: info?.email || "",
        username: info?.username || "",
        bio: info?.bio || "",
        avatar: info?.avatar
          ? {
              uri: info.avatar,
              fileName: info.avatar,
            }
          : null,
      });
    };
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (userInfo) {
      // 检查头像是否真的改变了（有新的本地文件）
      const avatarChanged = !!(form.avatar?.fileName && form.avatar.uri !== userInfo.avatar);
      
      setIsModified(
        form.nickname !== userInfo.nickname ||
          form.email !== userInfo.email ||
          form.username !== userInfo.username ||
          form.bio !== (userInfo.bio || "") ||
          avatarChanged
      );
    }
  }, [form.nickname, form.email, form.username, form.bio, form.avatar, userInfo]);

  // 检查用户名是否可用
  const checkUsername = useCallback(async (username: string) => {
    if (!username.trim() || username === userInfo?.username) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const exists = await userService.checkUsernameExist(username.trim());
      setUsernameAvailable(!exists);
    } catch (error) {
      console.error('Check username error:', error);
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  }, [userInfo?.username]);

  // 防抖检查用户名
  useEffect(() => {
    const timer = setTimeout(() => {
      checkUsername(form.username);
    }, 500);

    return () => clearTimeout(timer);
  }, [form.username, checkUsername]);

  // 处理返回时的键盘收起
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      Keyboard.dismiss();
    });

    return unsubscribe;
  }, [navigation]);

  const isValidUsername = (username: string) => {
    // 用户名规则：3-20个字符，只能包含字母、数字、下划线
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  // 表单验证
  const validateForm = useCallback(() => {
    const errors: string[] = [];
    
    if (!form.username.trim()) {
      errors.push('username_required');
    } else if (!isValidUsername(form.username.trim())) {
      errors.push('invalid_username');
    } else if (usernameAvailable === false) {
      errors.push('username_taken');
    }
    
    if (usernameChecking) {
      errors.push('checking_username');
    }
    
    setFormErrors(errors);
    return errors.length === 0;
  }, [form, usernameAvailable, usernameChecking]);

  // 重置表单
  const handleReset = useCallback(() => {
    if (userInfo) {
      setForm({
        nickname: userInfo.nickname || "",
        email: userInfo.email || "",
        username: userInfo.username || "",
        bio: userInfo.bio || "",
        avatar: null,
      });
      setUsernameAvailable(null);
      setFormErrors([]);
    }
  }, [userInfo]);

  // 4. 封装表单更新方法
  const updateForm = useCallback((updates: Partial<ProfileForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleAvatarPress = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      
      const extension = result.assets[0].uri.split('.').pop() || 'jpeg';
      const fileName = `avatar_${Date.now()}.${extension}`;
      
      updateForm({
        avatar: { uri: result.assets[0].uri, fileName },
      });
    } catch (error) {
      console.error("Failed to select image:", error);
      showToast("failed", {message: i18n.t("profile.errors.imageSelectFailed")}, 2000, "simple");
    }
  };

  const handleSave = async () => {
    if (loading) return;

    // 收起键盘
    Keyboard.dismiss();

    // 表单验证
    if (!validateForm()) {
      const errorMessages = {
        username_required: i18n.t("profile.errors.usernameRequired"),
        invalid_username: i18n.t("profile.errors.invalidUsername"),
        username_taken: i18n.t("profile.errors.usernameExists"),
        checking_username: i18n.t("profile.errors.checkingUsername"),
      };
      
      const firstError = formErrors[0];
      showToast("failed", {message: errorMessages[firstError as keyof typeof errorMessages] || i18n.t("profile.errors.updateFailed")}, 2000, "simple");
      return;
    }

    try {
      setLoading(true);
      let avatarUrl;

      // 上传头像 - 只有当选择了新头像且与当前头像不同时才上传
      if (form.avatar?.fileName && form.avatar.uri !== userInfo?.avatar) {
        const result = await uploadService.uploadAvatar(
          form.avatar.uri,
          form.avatar.fileName
        );
        if (!result.success) throw result.error;
        avatarUrl = result.url;
      }

      // 更新用户信息
      const updatePromises = [];

      // 如果用户名改变了，需要重命名
      if (form.username.trim() !== userInfo?.username) {
        updatePromises.push(userService.renameUsername(form.username.trim()));
      }

      // 更新其他信息
      if (form.nickname.trim() !== userInfo?.nickname || 
          form.bio.trim() !== (userInfo?.bio || "") || 
          avatarUrl) {
        updatePromises.push(
          userService.updateUserInfo(
            form.nickname.trim(),
            avatarUrl || userInfo?.avatar,
            form.bio.trim()
          )
        );
      }

      await Promise.all(updatePromises);

      // 更新本地存储的用户信息
      const updatedUserInfo = {
        ...userInfo!,
        nickname: form.nickname.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        bio: form.bio.trim(),
      };
      if (avatarUrl) updatedUserInfo.avatar = avatarUrl;
      
      await UserStorage.setUserInfo(updatedUserInfo);
      setUserInfo(updatedUserInfo);
      setFormErrors([]);
      
      showToast("success", {message: i18n.t("profile.actions.success")}, 2000, "simple");
      
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      console.error('Profile update error:', error);
      showToast("failed", {message: i18n.t("profile.errors.updateFailed")}, 2000, "simple");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppBar
        title={i18n.t("profile.title")}
        onBack={() => navigation.goBack()}
        style={{ paddingHorizontal: 16 }}
      />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 头像部分 */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handleAvatarPress}>
              <View style={styles.avatarContainer}>
                  <Image
                    source={form.avatar?.uri ? { uri: form.avatar.uri } : userInfo?.avatar ? { uri: userInfo.avatar } : DefaultAvatar}
                    style={styles.avatar}
                  />
                <UploadSvg style={styles.editButton}></UploadSvg>
              </View>
            </TouchableOpacity>
          </View>

          {/* 昵称输入 */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={i18n.t("profile.fields.nickname")}
              value={form.nickname}
              onChangeText={(text) => updateForm({ nickname: text })}
              autoCapitalize="none"
              autoCorrect={false}
              editable={true}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          {/* 用户名输入 */}
          <View style={styles.inputContainer}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.usernameInput}
              placeholder={i18n.t("profile.fields.username")}
              value={form.username}
              onChangeText={(text) => updateForm({ username: text })}
              autoCapitalize="none"
              autoCorrect={false}
              editable={true}
              returnKeyType="next"
              blurOnSubmit={false}
            />
            <View style={styles.indicator}>
              {usernameChecking ? (
                <ActivityIndicator size="small" color={Theme.text[100]} />
              ) : usernameAvailable === true ? (
                <Ionicons name="checkmark-circle" size={20} color="green" />
              ) : usernameAvailable === false ? (
                <Ionicons name="close-circle" size={20} color="red" />
              ) : (formErrors.includes('username_required') || formErrors.includes('invalid_username') || formErrors.includes('username_taken')) ? (
                <Ionicons name="alert-circle" size={20} color="red" />
              ) : null}
            </View>
          </View>

          {/* 个人简介输入 */}
          <View style={styles.bioInputContainer}>
            <TextInput
              style={styles.bioInput}
              placeholder={i18n.t("profile.fields.bio")}
              value={form.bio}
              onChangeText={(text) => updateForm({ bio: text })}
              multiline={true}
              numberOfLines={3}
              autoCapitalize="none"
              autoCorrect={false}
              editable={true}
              returnKeyType="done"
              blurOnSubmit={true}
            />
          </View>

          {/* 邮箱输入（只读） */}
          <View style={[styles.inputContainer, styles.disabledInputContainer]}>
            <TextInput
              style={styles.disabledInput}
              value={form.email}
              onChangeText={(text) => updateForm({ email: text })}
              autoCapitalize="none"
              autoCorrect={false}
              editable={false}
            />
          </View>

          {isModified && (
            <View style={styles.buttonContainer}>
              <Button
                style={styles.resetButton}
                onPress={handleReset}
                disabled={loading}
              >
                <Text style={styles.resetButtonText}>
                  {i18n.t("profile.actions.reset")}
                </Text>
              </Button>
              <Button
                style={styles.saveButton}
                onPress={handleSave}
                disabled={loading || formErrors.length > 0 || usernameChecking || usernameAvailable === false}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {i18n.t("profile.actions.save")}
                  </Text>
                )}
              </Button>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  avatarSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  editButton: {
    position: "absolute",
    right: -1,
    bottom: 0,
    width: 20,
    height: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E4E8",
    borderRadius: 12,
    marginBottom: 32,
  },
  atSymbol: {
    paddingLeft: 16,
    fontSize: 16,
    color: Theme.secondaryColors[900],
  },
  input: {
    flex: 1,
    height: "100%",
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 16,
    ...Platform.select({
      web: {
        outlineWidth: 0,
      },
    }),
  },
  usernameInput: {
    flex: 1,
    height: "100%",
    paddingRight: 16, 
    paddingLeft: 2,
    fontSize: 16,
    ...Platform.select({
      web: {
        outlineWidth: 0,
      },
    }),
  },
  indicator: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
  },
  bioInputContainer: {
    height: 80,
    borderWidth: 1,
    borderColor: "#E2E4E8",
    borderRadius: 12,
    marginBottom: 32,
  },
  bioInput: {
    flex: 1,
    height: "100%",
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 16,
    textAlignVertical: 'top',
    ...Platform.select({
      web: {
        outlineWidth: 0,
      },
    }),
  },
  disabledInputContainer: {
    backgroundColor: "#F7F8FA",
    borderColor: "transparent",
  },
  disabledInput: {
    flex: 1,
    height: "100%",
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 16,
    color: "#717277",
    ...Platform.select({
      web: {
        outlineWidth: 0,
      },
    }),
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    height: 48,
  },
  resetButtonText: {
    color: "#717277",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#000000",
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
    height: 48,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
