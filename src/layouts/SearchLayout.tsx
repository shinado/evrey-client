import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CloseIcon, BackIcon } from '../constants/icons';
import { FontFamily } from '../constants/typo';
import { Theme } from '../constants/Theme';

const SearchLayout: React.FC<{
  children: React.ReactNode;
  title: string;
  onBack?: () => void;
  onClose?: () => void;
}> = ({ children, title, onBack, onClose }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity hitSlop={10} onPress={onBack}>
          <BackIcon/>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 36 }} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {onClose ? (
        <TouchableOpacity hitSlop={10} onPress={onClose}>
          <CloseIcon />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 36 }} />
      )}
    </View>
      {children}
    </SafeAreaView>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    color: Theme.text[300],
  },
});

export default SearchLayout;
