import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { viewDocument } from '@react-native-documents/viewer';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { ShowNotify } from '@/components/ui/toast';
import { formatFileSize, getFileTheme } from '@/utils/file-helpers';
import {
  DocumentPreviewFile,
  DocumentPreviewMode,
  ensureCachedDocument,
  getDocumentDisplayName,
  getDocumentMimeType,
  getInitialPreviewMode,
  getNextPreviewMode,
  getPreviewUri,
  isInAppPreviewSupported,
} from '@/utils/document-preview';

type Props = {
  visible?: boolean;
  file: DocumentPreviewFile | null;
  onClose?: () => void;
  variant?: 'modal' | 'embedded';
  height?: number;
};

function ViewerChrome({
  file,
  onClose,
  onOpenExternal,
  openingExternal,
  showClose = true,
}: {
  file: DocumentPreviewFile;
  onClose?: () => void;
  onOpenExternal: () => void;
  openingExternal: boolean;
  showClose?: boolean;
}) {
  const displayName = getDocumentDisplayName(file);
  const theme = getFileTheme(displayName);
  const sizeLabel =
    typeof file.size === 'number' && file.size > 0
      ? formatFileSize(file.size)
      : '';

  return (
    <View style={styles.chrome}>
      {showClose ? (
        <TouchableOpacity onPress={onClose} style={styles.iconButton}>
          <Ionicons name="close" size={22} color="#1D1C1D" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButtonPlaceholder} />
      )}

      <View style={styles.chromeTitleWrap}>
        <AppText variant="bold" size={15} numberOfLines={1}>
          {displayName}
        </AppText>
        <AppText size={12} style={styles.chromeMeta}>
          {[sizeLabel, theme.kindLabel].filter(Boolean).join(' • ')}
        </AppText>
      </View>

      <TouchableOpacity
        onPress={onOpenExternal}
        style={styles.iconButton}
        disabled={openingExternal}
      >
        {openingExternal ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Ionicons name="open-outline" size={22} color="#1D1C1D" />
        )}
      </TouchableOpacity>
    </View>
  );
}

export function InAppDocumentViewer({
  visible = true,
  file,
  onClose,
  variant = 'modal',
  height = 420,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] =
    useState<DocumentPreviewMode>('office-online');
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [openingExternal, setOpeningExternal] = useState(false);

  const resetState = useCallback(() => {
    setLoading(true);
    setFailed(false);
    setLocalUri(null);
    setOpeningExternal(false);
  }, []);

  useEffect(() => {
    if (!file || (variant === 'modal' && !visible)) {
      return;
    }

    resetState();
    const initialMode = getInitialPreviewMode(file);
    setPreviewMode(initialMode);

    if (initialMode === 'local') {
      ensureCachedDocument(file)
        .then(path => setLocalUri(path))
        .catch(() => setFailed(true))
        .finally(() => setLoading(false));
    }
  }, [file, visible, variant, resetState]);

  const previewUri = useMemo(() => {
    if (!file) return null;
    return getPreviewUri(file, previewMode, localUri || undefined);
  }, [file, previewMode, localUri]);

  const openExternally = useCallback(async () => {
    if (!file || openingExternal) return;

    setOpeningExternal(true);
    try {
      const localPath = localUri || (await ensureCachedDocument(file));
      const uri = Platform.OS === 'android' ? `file://${localPath}` : localPath;
      await viewDocument({
        uri,
        mimeType: getDocumentMimeType(file),
        presentationStyle: 'fullScreen',
      });
    } catch {
      ShowNotify('Error', 'Unable to open this file on your device.');
    } finally {
      setOpeningExternal(false);
    }
  }, [file, localUri, openingExternal]);

  const handlePreviewFailure = useCallback(() => {
    if (!file) {
      setFailed(true);
      setLoading(false);
      return;
    }

    const nextMode = getNextPreviewMode(previewMode, file);
    if (!nextMode) {
      setFailed(true);
      setLoading(false);
      return;
    }

    if (nextMode === 'local' && !localUri) {
      setLoading(true);
      ensureCachedDocument(file)
        .then(path => {
          setLocalUri(path);
          setPreviewMode('local');
          setFailed(false);
        })
        .catch(() => setFailed(true))
        .finally(() => setLoading(false));
      return;
    }

    setPreviewMode(nextMode);
    setFailed(false);
    setLoading(true);
  }, [file, previewMode, localUri]);

  if (!file) {
    return null;
  }

  const displayName = getDocumentDisplayName(file);
  const theme = getFileTheme(displayName);
  const canPreviewInApp = isInAppPreviewSupported(
    displayName,
    getDocumentMimeType(file),
  );

  const content = (
    <View
      style={[styles.viewerContainer, variant === 'embedded' && { height }]}
    >
      <ViewerChrome
        file={file}
        onClose={onClose}
        onOpenExternal={openExternally}
        openingExternal={openingExternal}
        showClose={variant === 'modal'}
      />

      <View style={styles.webviewWrap}>
        {!canPreviewInApp || failed || !previewUri ? (
          <View style={styles.fallbackState}>
            <View
              style={[styles.fallbackIcon, { backgroundColor: theme.color }]}
            >
              <AppText variant="bold" style={styles.fallbackIconText}>
                {theme.label}
              </AppText>
            </View>
            <AppText
              variant="bold"
              size={16}
              style={styles.fallbackTitle}
              numberOfLines={2}
            >
              {displayName}
            </AppText>
            <AppText size={13} style={styles.fallbackSubtitle}>
              In-app preview is unavailable for this file. Open it with another
              app on your device.
            </AppText>
            <TouchableOpacity
              style={styles.fallbackButton}
              onPress={openExternally}
              disabled={openingExternal}
            >
              {openingExternal ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <AppText
                  variant="bold"
                  size={14}
                  style={styles.fallbackButtonText}
                >
                  Open in another app
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <AppText size={13} style={styles.loadingText}>
                  Loading preview…
                </AppText>
              </View>
            )}
            <WebView
              key={`${previewMode}-${previewUri}`}
              source={{ uri: previewUri }}
              style={styles.webview}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState={false}
              allowsFullscreenVideo
              setSupportMultipleWindows={false}
              onLoadStart={() => {
                setLoading(true);
                setFailed(false);
              }}
              onLoadEnd={() => setLoading(false)}
              onError={handlePreviewFailure}
              onHttpError={handlePreviewFailure}
            />
          </>
        )}
      </View>
    </View>
  );

  if (variant === 'embedded') {
    return content;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>{content}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 52 : 24,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chrome: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    backgroundColor: '#FFFFFF',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
  },
  iconButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  chromeTitleWrap: {
    flex: 1,
    paddingHorizontal: 10,
  },
  chromeMeta: {
    color: '#667781',
    marginTop: 2,
  },
  webviewWrap: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  loadingText: {
    color: '#667781',
    marginTop: 12,
  },
  fallbackState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  fallbackIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIconText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  fallbackTitle: {
    color: '#1D1C1D',
    textAlign: 'center',
    marginTop: 16,
  },
  fallbackSubtitle: {
    color: '#667781',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  fallbackButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 200,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  fallbackButtonText: {
    color: '#FFFFFF',
  },
});
