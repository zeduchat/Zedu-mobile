import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import {
  decodeFileName,
  formatFileSize,
  getFileTheme,
} from '@/utils/file-helpers';
import { InAppDocumentViewer } from './in-app-document-viewer';

const { width } = Dimensions.get('window');

type FileLike = {
  file_name?: string;
  name?: string;
  size?: number;
  file_link?: string;
  uri?: string;
  mime_type?: string;
  file_mime_type?: string;
  id?: string;
};

function getDisplayName(file: FileLike): string {
  return decodeFileName(file.file_name || file.name || 'Attachment');
}

function getFileSizeLabel(file: FileLike, fallbackSize?: string): string {
  if (typeof file.size === 'number' && file.size > 0) {
    return formatFileSize(file.size);
  }
  return fallbackSize || '';
}

function SpreadsheetPreviewMock({ accent }: { accent: string }) {
  return (
    <View style={styles.mockSpreadsheet}>
      {[0, 1, 2, 3].map(row => (
        <View key={row} style={styles.mockSpreadsheetRow}>
          <View
            style={[
              styles.mockSpreadsheetCell,
              styles.mockSpreadsheetHeader,
              { backgroundColor: accent },
            ]}
          />
          <View
            style={[styles.mockSpreadsheetCell, { backgroundColor: '#FFFFFF' }]}
          />
          <View
            style={[styles.mockSpreadsheetCell, { backgroundColor: '#FFFFFF' }]}
          />
        </View>
      ))}
    </View>
  );
}

function PresentationPreviewMock({ accent }: { accent: string }) {
  return (
    <View style={styles.mockPresentation}>
      <View style={[styles.mockSlide, { borderColor: accent }]}>
        <View style={[styles.mockSlideTitle, { backgroundColor: accent }]} />
        <View style={styles.mockSlideLine} />
        <View style={[styles.mockSlideLine, styles.mockSlideLineShort]} />
        <View style={[styles.mockSlideLine, styles.mockSlideLineShort]} />
      </View>
    </View>
  );
}

function DocumentPreviewMock({
  accent,
  label,
}: {
  accent: string;
  label: string;
}) {
  return (
    <View style={styles.mockDocument}>
      <View style={[styles.mockDocumentSheet, { borderColor: accent }]}>
        <View style={[styles.mockDocumentBadge, { backgroundColor: accent }]}>
          <AppText variant="bold" style={styles.mockDocumentBadgeText}>
            {label}
          </AppText>
        </View>
        <View style={styles.mockDocumentLine} />
        <View style={[styles.mockDocumentLine, styles.mockSlideLineShort]} />
        <View style={[styles.mockDocumentLine, styles.mockSlideLineShort]} />
      </View>
    </View>
  );
}

export function FileAttachmentPreviewPanel({
  fileName,
  size = 'message',
}: {
  fileName: string;
  size?: 'message' | 'editor' | 'modal';
}) {
  const theme = getFileTheme(fileName);
  const panelStyle =
    size === 'modal'
      ? styles.previewPanelModal
      : size === 'editor'
      ? styles.previewPanelEditor
      : styles.previewPanelMessage;

  return (
    <View style={[panelStyle, { backgroundColor: theme.previewBackground }]}>
      {theme.kind === 'spreadsheet' && (
        <SpreadsheetPreviewMock accent={theme.previewAccent} />
      )}
      {theme.kind === 'presentation' && (
        <PresentationPreviewMock accent={theme.previewAccent} />
      )}
      {(theme.kind === 'document' || theme.kind === 'file') && (
        <DocumentPreviewMock accent={theme.color} label={theme.label} />
      )}
      <View style={[styles.previewTypePill, { backgroundColor: theme.color }]}>
        <Ionicons name={theme.icon} size={12} color="#FFF" />
        <AppText variant="bold" size={10} style={styles.previewTypePillText}>
          {theme.kindLabel}
        </AppText>
      </View>
    </View>
  );
}

export function ChatFileAttachmentCard({
  file,
  fallbackSize,
  onPress,
  widthRatio = 0.72,
}: {
  file: FileLike;
  fallbackSize?: string;
  onPress?: () => void;
  widthRatio?: number;
}) {
  const displayName = getDisplayName(file);
  const theme = getFileTheme(displayName);
  const sizeLabel = getFileSizeLabel(file, fallbackSize);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, { width: width * widthRatio }]}
    >
      <FileAttachmentPreviewPanel fileName={displayName} size="message" />
      <View style={styles.cardFooter}>
        <View style={[styles.fileIconBox, { backgroundColor: theme.color }]}>
          <AppText variant="bold" style={styles.fileExtText}>
            {theme.label}
          </AppText>
        </View>
        <View style={styles.fileInfo}>
          <AppText numberOfLines={2} style={styles.fileNameText}>
            {displayName}
          </AppText>
          <AppText size={11} style={styles.fileMetaText}>
            {[sizeLabel, theme.kindLabel].filter(Boolean).join(' • ')}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#ABB2BA" />
      </View>
    </TouchableOpacity>
  );
}

export function ChatFilePreviewModal({
  visible,
  file,
  onClose,
}: {
  visible: boolean;
  file: FileLike | null;
  onClose: () => void;
}) {
  return (
    <InAppDocumentViewer
      visible={visible}
      file={file}
      onClose={onClose}
      variant="modal"
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E9EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 4,
  },
  previewPanelMessage: {
    height: 132,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewPanelEditor: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewPanelModal: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewTypePill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  previewTypePillText: {
    color: '#FFF',
  },
  mockSpreadsheet: {
    width: '78%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  mockSpreadsheetRow: {
    flexDirection: 'row',
    height: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  mockSpreadsheetCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.05)',
  },
  mockSpreadsheetHeader: {
    maxWidth: 42,
  },
  mockPresentation: {
    width: '72%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockSlide: {
    width: '100%',
    height: 92,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  mockSlideTitle: {
    width: '55%',
    height: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  mockSlideLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginBottom: 6,
    width: '88%',
  },
  mockSlideLineShort: {
    width: '62%',
  },
  mockDocument: {
    width: '68%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockDocumentSheet: {
    width: '100%',
    minHeight: 96,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  mockDocumentBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 10,
  },
  mockDocumentBadgeText: {
    color: '#FFF',
    fontSize: 10,
  },
  mockDocumentLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginBottom: 6,
    width: '90%',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF0F2',
    backgroundColor: '#FFFFFF',
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fileExtText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  fileInfo: {
    flex: 1,
    paddingRight: 6,
  },
  fileNameText: {
    fontSize: 14,
    color: '#1D1C1D',
    fontWeight: '600',
  },
  fileMetaText: {
    color: '#667781',
    marginTop: 2,
  },
});
