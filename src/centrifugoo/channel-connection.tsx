import { useEffect, useRef } from 'react';
import { Centrifuge } from 'centrifuge';
import axios from 'axios';
import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { BASE_URL, CONNECT_URL } from '@env';
import { ShowNotify } from '@/components/ui/toast';
import { Dimensions } from 'react-native';

interface Props {
  id: string;
}

const ChannelConnection = ({ id }: Props) => {
  const { state, dispatch } = useDataContext();
  const { user, buzzParticipants, buzzChats } = state || {};

  const participantsRef = useRef<any[]>(buzzParticipants || []);
  const chatsRef = useRef<any[]>(buzzChats || []);

  useEffect(() => {
    participantsRef.current = buzzParticipants;
  }, [buzzParticipants]);

  useEffect(() => {
    chatsRef.current = buzzChats;
  }, [buzzChats]);

  const getConnectionToken = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/token/connection`, {
        headers: {
          Authorization: `Bearer ${state?.token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data.data.token;
    } catch (error) {
      console.error('Centrifugo Conn Token Error:', error);
    }
  };

  const getSubscriptionToken = async (channel: string) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/token/subscription`,
        { channel },
        {
          headers: {
            Authorization: `Bearer ${state?.token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data.token;
    } catch (error) {
      console.error('Centrifugo Sub Token Error:', error);
    }
  };

  useEffect(() => {
    if (!id || !state?.token) return;

    const centrifugeClient: any = new Centrifuge(CONNECT_URL, {
      getToken: getConnectionToken,
      debug: true,
    });

    const sub = centrifugeClient.newSubscription(id, {
      getToken: () => getSubscriptionToken(id),
    });

    sub.on('publication', (ctx: any) => {
      const { data } = ctx;
      // dispatch({type:ACTIONS.CALLBACK, payload: !state.callback})
      console.log(data);

      if (data?.type === 'message') {
        dispatch({
          type: ACTIONS.CHANNELS_CHAT,
          payload: {
            newMessage: data,
          },
        });
        dispatch({
          type: ACTIONS.CHANNEL_CALLBACK,
          payload: !state?.channelCallback,
        });
      }

      if (
        data?.section === 'channels_section' &&
        data?.notification_type === 'reply_count_change'
      ) {
        const message = data?.data;
        const updates = data?.update_change;

        dispatch({
          type: ACTIONS.UPDATE_CHANNEL_MESSAGE_THREAD,
          payload: {
            threadId: message.thread_id,
            reply: message,
            updates,
          },
        });
      }

      // REACTIONS SECTION
      if (
        data?.section === 'thread_message' &&
        data?.notification_type === 'reaction_event'
      ) {
        const ids = ctx?.data?.modification_ids;
        const reactions = ctx?.data?.reactions;

        dispatch({
          type: ACTIONS.UPDATE_CHANNEL_REACTIONS,
          payload: {
            threadId: ids.thread_id,
            reactions,
          },
        });
      }

      // DELETE DM MESSAGE
      if (
        data?.section === 'thread_message' &&
        data?.notification_type === 'deleted'
      ) {
        const threadId = data?.modification_ids?.thread_id;

        dispatch({
          type: ACTIONS.DELETE_CHANNEL_MESSAGE,
          payload: {
            threadId: threadId,
          },
        });
      }

      const payload = ctx?.data;

      const currentParticipants = participantsRef.current || [];
      const currentChats = chatsRef.current || [];

      if (payload?.notification_type === 'user_joined_buzz') {
        const buzzEventData = payload?.data || payload;
        const newUser =
          buzzEventData?.user_joined || buzzEventData?.data?.user_joined;

        if (newUser && newUser.user_id) {
          const alreadyExists = currentParticipants.some(
            (p: any) => String(p.user_id) === String(newUser.user_id),
          );

          if (!alreadyExists) {
            const participantToAdd = {
              ...newUser,
              videoTrack: null,
              audioTrack: null,
              handsRaised: false,
              isPinned: false,
              status: 'active',
            };

            dispatch({
              type: ACTIONS.BUZZ_PARTICIPANTS,
              payload: [...currentParticipants, participantToAdd],
            });

            if (String(newUser.user_id) !== String(user?.user_id)) {
              ShowNotify(
                'Info',
                `${newUser.username || 'A participant'} joined the buzz`,
              );
            }
          }
        }
      }

      if (payload?.event === 'user_left_buzz') {
        const buzzEventData = payload?.data || payload;
        const userWhoLeft =
          buzzEventData?.user_left || buzzEventData?.data?.user_left;

        if (userWhoLeft && userWhoLeft.user_id) {
          const updatedParticipants = currentParticipants.filter(
            (p: any) => String(p.user_id) !== String(userWhoLeft.user_id),
          );

          dispatch({
            type: ACTIONS.BUZZ_PARTICIPANTS,
            payload: updatedParticipants,
          });

          if (String(userWhoLeft.user_id) !== String(user?.user_id)) {
            ShowNotify(
              'Info',
              `${userWhoLeft.username || 'A participant'} left the buzz`,
            );
          }
        }
      }

      if (payload?.notification_type === 'buzz_reaction_event') {
        const reactionData = payload.data;

        if (reactionData?.user_id === user?.user_id) return;

        if (reactionData?.reaction_type === 'emoji') {
          const id = Date.now() + Math.random();

          const { width, height } = Dimensions.get('window');
          const newFloatingEmoji = {
            id,
            emoji: reactionData.content,
            x: width / 2 + (Math.random() - 0.5) * 100,
            y: height - 100,
            name: reactionData.username,
            jitter: (Math.random() - 0.5) * 80,
          };

          dispatch({
            type: ACTIONS.ADD_FLOATING_EMOJI,
            payload: newFloatingEmoji,
          });

          setTimeout(() => {
            dispatch({ type: ACTIONS.REMOVE_FLOATING_EMOJI, payload: id });
          }, 1800);
        }
      }

      if (payload?.notification_type === 'buzz_sticker_event') {
        const stickerData = payload.data;

        // Always pull the freshest list from the ref immediately before updating
        const latestParticipants = participantsRef.current || [];

        if (stickerData?.sticker === 'raise_hand') {
          const updated = latestParticipants.map((p: any) =>
            String(p.user_id) === String(stickerData.user_id)
              ? { ...p, handsRaised: true }
              : p,
          );
          dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
        }

        if (stickerData?.sticker === 'away') {
          const updated = latestParticipants.map((p: any) =>
            String(p.user_id) === String(stickerData.user_id)
              ? { ...p, handsRaised: false }
              : p,
          );

          dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
        }
      }

      // Handle audio/video status changes
      if (payload?.notification_type === 'user_audio_status_changed') {
        const statusData = payload.data;
        const latestParticipants = participantsRef.current || [];

        if (statusData?.user_id) {
          const updated = latestParticipants.map((p: any) =>
            String(p.user_id) === String(statusData.user_id)
              ? { ...p, audioTrack: statusData.audio_enabled }
              : p,
          );
          dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
        }
      }

      if (payload?.notification_type === 'user_video_status_changed') {
        const statusData = payload.data;
        const latestParticipants = participantsRef.current || [];

        if (statusData?.user_id) {
          const updated = latestParticipants.map((p: any) =>
            String(p.user_id) === String(statusData.user_id)
              ? { ...p, videoTrack: statusData.video_enabled }
              : p,
          );
          dispatch({ type: ACTIONS.BUZZ_PARTICIPANTS, payload: updated });
        }
      }

      if (payload?.type === 'buzz_message') {
        const newMessage = payload?.data || payload;
        const incomingMessageId = String(
          newMessage?.message_id ?? newMessage?.id ?? '',
        );

        if (incomingMessageId) {
          const exists = currentChats.some(
            (message: any) =>
              String(message?.message_id ?? message?.id ?? '') ===
              incomingMessageId,
          );

          if (exists) {
            return;
          }
        }

        dispatch({
          type: ACTIONS.BUZZ_CHATS,
          payload: [...currentChats, newMessage],
        });
      }

      // BUZZ STARTED
      // if (data?.notification_type === "buzz_started") {
      //     const active_buzz = {
      //         buzz_id: data?.data?.buzz_id,
      //         host_id: data?.data?.host_id,
      //         host_name: data?.data?.host_name ?? '',
      //         participant_count: data?.data?.participant_ids?.length ?? 0,
      //         started_at: data?.data?.created_at,
      //     };
      //     // Update channelDetails (object)
      //     dispatch({
      //         type: ACTIONS.CHANNEL_DETAILS,
      //         payload: { ...state?.channelDetails, active_buzz } as any,
      //     });
      //     // Efficiently update active_buzz for the correct userChannel (array)
      //     if (Array.isArray(state?.userChannels)) {
      //         const channelId = data?.data?.channel_id;
      //         // Find the last matching channel from the end
      //         const idx = state.userChannels.length > 0
      //             ? [...state.userChannels].reverse().findIndex((channel: any) => channel.channels_id === channelId)
      //             : -1;
      //         if (idx !== -1) {
      //             // Convert reverse index to original index
      //             const realIdx = state.userChannels.length - 1 - idx;
      //             const updatedUserChannels = [...state.userChannels];
      //             updatedUserChannels[realIdx] = {
      //                 ...updatedUserChannels[realIdx],
      //                 active_buzz,
      //             };
      //             dispatch({
      //                 type: ACTIONS.USER_CHANNELS,
      //                 payload: updatedUserChannels as any,
      //             });
      //         }
      //     }
      // }

      // // BUZZ ENDED
      // if (data?.notification_type === "buzz_ended") {
      //     // Remove active_buzz from channelDetails (object)
      //     const { active_buzz, ...rest } = state?.channelDetails ?? {};
      //     dispatch({
      //         type: ACTIONS.CHANNEL_DETAILS,
      //         payload: rest as any,
      //     });
      //     // Efficiently remove active_buzz only from the correct userChannel (array)
      //     if (Array.isArray(state?.userChannels)) {
      //         const channelId = data?.data?.channel_id || data?.modification_ids?.channel_id;
      //         const idx = state.userChannels.length > 0
      //             ? [...state.userChannels].reverse().findIndex((channel: any) => channel.channels_id === channelId)
      //             : -1;
      //         if (idx !== -1) {
      //             const realIdx = state.userChannels.length - 1 - idx;
      //             const updatedUserChannels = [...state.userChannels];
      //             updatedUserChannels[realIdx] = {
      //                 ...updatedUserChannels[realIdx],
      //                 active_buzz: undefined,
      //             };
      //             dispatch({
      //                 type: ACTIONS.USER_CHANNELS,
      //                 payload: updatedUserChannels as any,
      //             });
      //         }
      //     }
      // }
    });

    sub.on('error', (ctx: any) =>
      console.error(`Subscription error: ${ctx.message}`),
    );

    centrifugeClient.connect();
    sub.subscribe();

    return () => {
      sub.unsubscribe();
      centrifugeClient.disconnect();
    };
  }, [id, state?.token]);

  return null;
};

export default ChannelConnection;
