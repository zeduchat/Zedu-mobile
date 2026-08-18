import React, { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import Markdown from 'react-native-markdown-display';

const { width } = Dimensions.get('window');


const ThreadItem = ({ item, onLongPress, isGroup }: any) => {
   
    const showDateHeader = item.date;
    const isReceived = !item.sent;
    const [viewerVisible, setViewerVisible] = useState(false);

    const markdownStyles = {
        text: { color: '#111B21', fontSize: 15 },
        paragraph: { marginVertical: 0 },
        strong: { fontWeight: 'bold' as const, color: '#111B21' },
        em: { fontStyle: 'italic' as const, color: '#111B21' },
    };

    const getFileTheme = (fileName: string) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return { color: '#FF5722', label: 'PDF' };
        if (ext === 'doc' || ext === 'docx') return { color: '#2B579A', label: 'DOC' };
        if (ext === 'xls' || ext === 'xlsx') return { color: '#217346', label: 'XLS' };
        return { color: '#607D8B', label: 'FILE' };
    };

    const handleMediaPress = () => {
        setViewerVisible(true);
    };

    const fileTheme = item.file ? getFileTheme(item.file.name) : null;

    return (
        <View style={{borderBottomWidth:1, borderColor:Colors.border, paddingBottom:30}}>
                <View style={styles.dateHeader}>
                    <AppText style={styles.dateText}>{item.date}</AppText>
                </View>

            
            <View style={[
                styles.rowContainer,
                // styles.receivedRow
            ]}>

                
                    <View style={styles.groupAvatarContainer}>
                        <Image
                            source={item.senderImg || require('@/assets/images/avatar.png')}
                            style={styles.groupSenderAvatar}
                        />
                    </View>
                

                <TouchableOpacity
                    activeOpacity={0.8}
                    onLongPress={() => onLongPress(item)}
                    delayLongPress={200}
                    style={[
                        styles.messageWrapper,
                        item.sent ? styles.sentWrapper : styles.receivedWrapper,
                        isGroup && isReceived && { maxWidth: '80%' }
                    ]}
                >
                    <View style={[styles.bubble, item.sent ? styles.sentBubble : styles.receivedBubble]}>

                        
                        {isGroup && isReceived && item.senderName && (
                            <AppText
                                size={13}
                                variant="bold"
                                style={[styles.senderNameLabel, { color: item.senderColor || Colors.primary }]}
                            >
                                {item.senderName}
                            </AppText>
                        )}

                        {/* IMAGE LOGIC */}
                        {item.type === 'image' && item.image && (
                            <TouchableOpacity activeOpacity={0.9} onPress={handleMediaPress} style={styles.mediaContainer}>
                                <Image source={{ uri: item.image }} style={styles.mediaImage} />
                                {!item.text && (
                                    <View style={styles.mediaTimeOverlay}>
                                        <AppText size={10} style={styles.mediaTimeText}>{item.time}</AppText>
                                        {item.sent && (
                                            <Image source={require('@/assets/icons/read-receipt.png')} style={styles.receiptIconSmall} />
                                        )}
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* VIDEO LOGIC (Updated with your request) */}
                        {item.type === 'video' && item.video && (
                            <TouchableOpacity activeOpacity={0.9} onPress={handleMediaPress} style={styles.mediaContainer}>
                                <View style={styles.videoWrapper}>
                                    <Video
                                        source={{ uri: item.video }}
                                        style={styles.mediaImage}
                                        resizeMode="cover"
                                        paused={true}
                                    />
                                    <View style={styles.videoPlayOverlay}>
                                        <View style={styles.playIconCircle}>
                                            <Ionicons name="play" size={32} color="white" />
                                        </View>
                                    </View>
                                    {/* Video timing icon at bottom */}
                                    <View style={styles.videoDurationLabel}>
                                        <Ionicons name="videocam" size={12} color="white" />
                                        <AppText size={10} style={{ color: 'white', marginLeft: 4 }}>0:07</AppText>
                                    </View>
                                </View>
                                {!item.text && (
                                    <View style={styles.mediaTimeOverlay}>
                                        <AppText size={10} style={styles.mediaTimeText}>{item.time}</AppText>
                                        {item.sent && (
                                            <Image source={require('@/assets/icons/read-receipt.png')} style={styles.receiptIconSmall} />
                                        )}
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* VOICE LOGIC */}
                        {item.type === 'audio' && item.voice && (
                            <View style={styles.voiceContainer}>
                                <TouchableOpacity style={styles.playBtn}>
                                    <FontAwesome5Icon name='play' size={16} style={styles.playIcon} />
                                </TouchableOpacity>
                                <View style={styles.waveformContainer}>
                                    <View style={styles.waveformLine} />
                                    <View style={[styles.playbackThumb, { backgroundColor: Colors.primary }]} />
                                    <AppText size={10} style={styles.voiceDuration}>0:15</AppText>
                                </View>
                                <View style={styles.voiceAvatarContainer}>
                                    <Image source={require('@/assets/images/avatar.png')} style={styles.voiceAvatar} />
                                    <View style={[styles.micBadge, { backgroundColor: Colors.primary }]}>
                                        <Image source={require('@/assets/icons/mic.png')} style={styles.miniMic} />
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* FILE LOGIC */}
                        {item.type === 'file' && item.file && (
                            <View style={styles.complexFileWrapper}>
                                <View style={styles.fileMainRow}>
                                    <View style={[styles.fileIconBox, { backgroundColor: fileTheme?.color }]}>
                                        <AppText style={styles.fileExtText}>{fileTheme?.label}</AppText>
                                    </View>
                                    <View style={styles.fileInfo}>
                                        <AppText numberOfLines={1} style={styles.fileNameText}>{typeof item.file === 'string' ? item.file : item.file.name}</AppText>
                                        <AppText size={11} style={styles.fileMetaText}>
                                            {item.file.size || '1.2 MB'} • {fileTheme?.label}
                                        </AppText>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* TEXT LOGIC */}
                        {item.text !== '' && (
                            <Markdown style={markdownStyles}>
                                {item.text?.replace(/<[^>]*>?/gm, '') || ''}
                            </Markdown>
                        )}

                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // NEW Styles for Group Layout
    rowContainer: { flexDirection: 'row', alignItems:'flex-start', paddingLeft:10 },
    // receivedRow: { alignSelf: 'flex-start', alignItems: 'flex-start', paddingLeft: 10 },
    sentRow: { alignSelf: 'flex-end', paddingRight: 10 },
    groupAvatarContainer: { marginRight: 8},
    groupSenderAvatar: { width: 30, height: 30, borderRadius: 15 },
    senderNameLabel: { paddingHorizontal: 8, paddingTop: 4, paddingBottom: 2 },
    messageWrapper: { maxWidth: '85%' },
    sentWrapper: { alignSelf: 'flex-end' },
    receivedWrapper: { alignSelf: 'flex-start' },
    bubble: { padding: 4, borderRadius: 12, elevation: 0.5, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 1 },
    sentBubble: { backgroundColor: Colors.topNavigation, borderTopRightRadius: 2 },
    receivedBubble: { backgroundColor: Colors.white, borderTopLeftRadius: 2 },
    mediaContainer: { position: 'relative' },
    videoWrapper: { width: width * 0.75, height: 220, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
    mediaImage: { width: width * 0.75, height: 220, borderRadius: 10 },
    videoPlayOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' },
    playIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingLeft: 4 },
    videoDurationLabel: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
    mediaTimeOverlay: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
    mediaTimeText: { color: 'white' },
    receiptIconSmall: { width: 14, height: 14, marginLeft: 3, tintColor: '#53bdeb' },
    voiceContainer: { flexDirection: 'row', alignItems: 'center', width: width * 0.65, paddingVertical: 10, paddingHorizontal: 6 },
    playBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    playIcon: { color: '#8696A0' },
    waveformContainer: { flex: 1, height: 35, justifyContent: 'center', marginHorizontal: 8 },
    waveformLine: { height: 2, backgroundColor: '#B6B9BB', width: '100%', borderRadius: 1 },
    playbackThumb: { width: 10, height: 10, borderRadius: 5, position: 'absolute', left: '0%' },
    voiceDuration: { position: 'absolute', bottom: -2, left: 0, color: '#667781' },
    voiceAvatarContainer: { position: 'relative', width: 36, height: 36, marginLeft: 4 },
    voiceAvatar: { width: 36, height: 36, borderRadius: 18 },
    micBadge: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
    miniMic: { width: 8, height: 8, tintColor: '#FFF' },
    complexFileWrapper: { backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: 10, width: width * 0.65, marginBottom: 4 },
    fileMainRow: { flexDirection: 'row', alignItems: 'center' },
    fileIconBox: { width: 42, height: 42, borderRadius: 6, justifyContent: 'center', alignItems: 'center', elevation: 1 },
    fileExtText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
    fileInfo: { flex: 1, marginLeft: 12 },
    fileNameText: { fontSize: 14, color: '#111B21', fontWeight: '500' },
    fileMetaText: { color: '#667781', marginTop: 2 },
    replyContainer: { backgroundColor: 'rgba(0,0,0,0.05)', padding: 8, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: Colors.primary, marginBottom: 5, marginHorizontal: 4, marginTop: 4 },
    messageText: { color: '#111B21', fontSize: 15, paddingHorizontal: 8, paddingVertical: 4 },
    messageFooter: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', marginTop: 2, paddingRight: 8, paddingBottom: 4 },
    timeText: { color: '#667781' },
    receiptIcon: { width: 16, height: 16, marginLeft: 4, tintColor: '#53bdeb' },
    dateHeader: { alignSelf: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginVertical: 15 },
    dateText: { color: '#54656F', fontSize: 12, fontWeight: '500' },
    threadAction: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 10, marginRight: 4 },
});

export default ThreadItem;