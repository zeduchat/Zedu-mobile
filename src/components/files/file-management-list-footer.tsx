import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '@/theme/colors';
import { fileManagementStyles as styles } from './file-management.styles';

type FileManagementListFooterProps = {
  visible: boolean;
};

const FileManagementListFooter: React.FC<FileManagementListFooterProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.footerLoader}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );
};

export default FileManagementListFooter;
