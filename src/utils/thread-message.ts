import { ACTIONS } from '@/store/types';

export type ThreadChatType = 'dm' | 'group_dm' | 'channel';

export function getThreadMessageSendUrl(chatType: ThreadChatType, channelId: string): string {
    switch (chatType) {
        case 'group_dm':
            return `/group-dms/messages/${channelId}`;
        case 'channel':
            return `/channels/${channelId}/messages`;
        default:
            return `/dms/messages/${channelId}`;
    }
}

export function getThreadMessageCallbackAction(chatType: ThreadChatType) {
    return chatType === 'channel' ? ACTIONS.CHANNEL_CALLBACK : ACTIONS.CALLBACK;
}
