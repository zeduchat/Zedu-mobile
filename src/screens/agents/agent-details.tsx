import React from 'react';
import {
    StyleSheet,
    View,
    Image,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { normalize } from '@/utils/normalize';
import { SafeAreaView } from 'react-native-safe-area-context';
import UseAgentDetails from '@/services/agents/agent-details';
import Markdown from 'react-native-markdown-display';
import { AgentDetailsSkeleton } from '@/components/skeleton/agent-details';


const AgentDetailsScreen = ({ navigation, route }: any) => {

    const { id } = route.params as { id: string }
    const {loading, agent} = UseAgentDetails(id)


    const InfoSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <View style={styles.section}>
            <AppText variant="bold" style={styles.sectionTitle}>{title}</AppText>
            {children}
            <View style={styles.divider} />
        </View>
    );

    const BulletPoint = ({ text }: { text: {content:string} }) => (
        <View style={styles.bulletRow}>
            <View style={styles.bullet} />
            <AppText style={styles.bulletText}>{text.content}</AppText>
        </View>
    );

    // markdown styles
    const markdownStyles = StyleSheet.create({
        body: {
            color: '#666666',
            fontSize: normalize(14),
            lineHeight: 22,
        },
        bullet_list: {
            marginTop: 10,
        },
        heading1: {
            color: '#1C1C1E',
            fontSize: normalize(18),
            marginBottom: 5,
        },
        strong: {
            fontWeight: 'bold',
            color: '#1C1C1E',
        },
        link: {
            color: Colors.primary,
        }
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#3F3D89" />
             

            {/* Dark Header */}
            <View style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <AppText variant="bold" style={styles.headerTitle}>{agent?.name}</AppText>
                        <View style={{ width: 24 }} /> 
                    </View>
                </SafeAreaView>
            </View>

            {/* Content Container */}
            <View style={styles.contentCard}>
                {loading ? 
                <AgentDetailsSkeleton />
                :
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* Agent Branding */}
                    <View style={styles.brandingSection}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={agent?.avatar ? { uri: agent?.avatar } : require('@/assets/images/agent-avatar.png')}
                                style={styles.avatar}
                                resizeMode="contain"
                            />
                        </View>
                        <AppText variant="bold" style={styles.agentName}>{agent?.name}</AppText>
                        <View style={styles.roleBadge}>
                            <AppText variant="medium" style={styles.roleText}>{agent?.title}</AppText>
                        </View>
                    </View>

                    {/* About Section */}
                    <InfoSection title="About">
                        <AppText style={styles.aboutText}>{agent?.description}</AppText>
                    </InfoSection>

                    <InfoSection title="">
                        <Markdown style={markdownStyles}>
                            {agent?.benefits || ""}
                        </Markdown>
                    </InfoSection>

                    <InfoSection title="">
                        <Markdown style={markdownStyles}>
                            {agent?.why_use || ""}
                        </Markdown>
                    </InfoSection>

                    <InfoSection title="">
                        <Markdown style={markdownStyles}>
                            {agent?.how_it_works || ""}
                        </Markdown>
                    </InfoSection>

                    {/* Capabilities Section */}
                    <InfoSection title="What it can do">
                        {agent?.system_prompts.map((item:any, index: number) => (
                            <BulletPoint key={index} text={item} />
                        ))} 
                    </InfoSection>

                    {/* Remove Action */}
                    {/* <TouchableOpacity style={styles.removeButton}>
                        <AppText variant="bold" style={styles.removeButtonText}>Remove Agent</AppText>
                    </TouchableOpacity> */}

                </ScrollView>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3F3D89',
    },
    header: {
        paddingHorizontal: normalize(16),
        paddingBottom: normalize(20),
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: normalize(10),
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: normalize(18),
        color: '#FFFFFF',
    },
    contentCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: normalize(24),
        borderTopRightRadius: normalize(24),
    },
    scrollContent: {
        paddingHorizontal: normalize(24),
        paddingTop: normalize(30),
        paddingBottom: normalize(40),
    },
    brandingSection: {
        alignItems: 'center',
        marginBottom: normalize(30),
    },
    avatarContainer: {
        width: normalize(100),
        height: normalize(100),
        borderRadius: normalize(50),
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: normalize(16),
    },
    avatar: {
        width: normalize(60),
        height: normalize(60),
    },
    agentName: {
        fontSize: normalize(24),
        color: '#1C1C1E',
        marginBottom: normalize(8),
    },
    roleBadge: {
        backgroundColor: '#EEF0FF',
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(6),
        borderRadius: normalize(8),
    },
    roleText: {
        fontSize: normalize(12),
        color: '#3F3D89',
        letterSpacing: 0.5,
    },
    section: {
        marginTop: normalize(20),
    },
    sectionTitle: {
        fontSize: normalize(16),
        color: '#1C1C1E',
        marginBottom: normalize(12),
    },
    aboutText: {
        fontSize: normalize(14),
        color: '#666666',
        lineHeight: 22,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: normalize(8),
        paddingLeft: normalize(4),
    },
    bullet: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#8E8E93',
        marginTop: 8,
        marginRight: normalize(10),
    },
    bulletText: {
        fontSize: normalize(14),
        color: '#666666',
        flex: 1,
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#F2F2F7',
        marginTop: normalize(20),
    },
    removeButton: {
        marginTop: normalize(30),
        backgroundColor: '#FFF1F1',
        height: normalize(56),
        borderRadius: normalize(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#FF3B30',
        fontSize: normalize(16),
    },
});

export default AgentDetailsScreen;