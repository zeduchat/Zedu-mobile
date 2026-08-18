import React from 'react';
import { TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fileManagementStyles as styles } from './file-management.styles';

type FileManagementFolderHeaderProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

const FileManagementFolderHeader: React.FC<FileManagementFolderHeaderProps> = ({
  searchQuery,
  onSearchChange,
}) => (
  <View style={styles.topChrome}>
    <View style={styles.searchWrap}>
      <Ionicons name="search" size={18} color="#8696A0" />
      <TextInput
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder="Search files in folder..."
        placeholderTextColor="#8696A0"
        style={styles.searchInput}
      />
    </View>
  </View>
);

export default FileManagementFolderHeader;
