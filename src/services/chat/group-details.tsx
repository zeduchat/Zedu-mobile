import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { GetRequest } from '@/utils/requests';
import { useEffect } from 'react';

interface Props {
  channel_id: string;
}

const UseGroupDetails = ({ channel_id }: Props) => {
  const { state, dispatch } = useDataContext();
  const { orgId, groupCallback } = state;

  useEffect(() => {
    if (orgId && channel_id) {
      const fetchGroupDetails = async () => {
        const { data, error } = await GetRequest(
          `/organisations/${orgId}/dms/participants/${channel_id}`,
        );

        if (!error) {
          dispatch({ type: ACTIONS.GROUP_DETAILS, payload: data.data });
        }
      };
      fetchGroupDetails();
    }
  }, [orgId, dispatch, groupCallback, channel_id]);

  return <></>;
};

export default UseGroupDetails;
