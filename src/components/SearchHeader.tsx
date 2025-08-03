import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, StyleSheet, TextInput, Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../constants/Theme";
import i18n from "../i18n";

interface SearchHeaderProps {
  value?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  value,
  onSearch,
  placeholder = i18n.t('search.token_placeholder'),
}) => {
  const [searchValue, setSearchValue] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout>();
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setSearchValue(value || '');
  }, [value]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchValue(text);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    // 300ms delay for debounce
    searchTimeout.current = setTimeout(() => {
      onSearch?.(text.trim());
    }, 300);
  }, [onSearch]);

  const handleClear = () => {
    setSearchValue('');
    onSearch?.('');
  };

  return (
    <View style={styles.container}>
        <View style={[styles.inputContainer, isFocused && styles.searchInputFocused]}>
          <TextInput
            value={searchValue}
            onChangeText={handleSearchChange}
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={Theme.secondaryColors[400]}
            autoFocus
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <TouchableOpacity 
            style={searchValue.length > 0 ? styles.backButton : styles.clearButtonHidden}
            onPress={handleClear}
            disabled={searchValue.length === 0}  
          >
            <Ionicons name="close-circle" size={20} color={'#00000080'} />
          </TouchableOpacity>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.secondaryColors[100],
    borderRadius: 25,
    marginHorizontal: 8,
    height: 44,
  },
  placeholder: {
    fontSize: 16,
    color: Theme.secondaryColors[400],
    paddingLeft: 40,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: Theme.background[200],
    borderRadius: 12,
    paddingHorizontal: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: Theme.background[300],
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: Theme.text[300],
    paddingRight: 24,
    marginVertical: 0,
    ...Platform.select({
      web:{
        outlineWidth: 0,
      }
    }),
  },
  searchInputFocused: {
    borderColor: Theme.text[300],
  },
  backButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonHidden: {
    opacity: 0,
  },
});

export default SearchHeader;
