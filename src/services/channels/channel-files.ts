import { useState, useCallback, useEffect, useRef } from 'react';
import { GetRequest, buildQueryString } from '@/utils/requests';

export type ChannelFileMediaItem = {
    id: string;
    file_name: string;
    file_type: string;
    mime_type: string;
    file_link: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    url?: string;
    thread_id?: string;
    username?: string;
    avatar_url?: string;
};

export type ChannelFileThread = {
    thread_id: string;
    user_id: string;
    username: string;
    avatar_url: string;
    created_at: string;
    media: ChannelFileMediaItem[];
};

type ChannelFilesPagination = {
    current_page: number;
    page_size?: number;
    page_count?: number;
    total_items: number;
    total_pages?: number;
    total_pages_count?: number;
};

type ChannelFilesResponse = {
    status: string;
    status_code: number;
    message: string;
    data: ChannelFileThread[];
    pagination?: ChannelFilesPagination;
};

const PAGE_LIMIT = 20;

const flattenChannelFiles = (threads: ChannelFileThread[]): ChannelFileMediaItem[] => {
    return threads.flatMap((thread) =>
        (thread.media || []).map((item) => ({
            ...item,
            thread_id: thread.thread_id,
            username: thread.username,
            avatar_url: thread.avatar_url,
        })),
    );
};

const isThreadBatch = (items: unknown[]): boolean => {
    const first = items[0];
    if (!first || typeof first !== 'object') {
        return false;
    }
    return Array.isArray((first as ChannelFileThread).media);
};

/** API may return threaded batches or a flat list of file objects. */
const normalizeChannelFilesData = (data: unknown): ChannelFileMediaItem[] => {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }
    if (isThreadBatch(data)) {
        return flattenChannelFiles(data as ChannelFileThread[]);
    }
    return data as ChannelFileMediaItem[];
};

export const useChannelFiles = (
    channelId?: string,
    fileType?: string,
) => {
    const [files, setFiles] = useState<ChannelFileMediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const filesRef = useRef<ChannelFileMediaItem[]>([]);
    const fileTypeRef = useRef(fileType);

    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    useEffect(() => {
        fileTypeRef.current = fileType;
    }, [fileType]);

    const fetchFiles = useCallback(async (isInitial: boolean) => {
        if (!channelId) {
            return;
        }

        if (isInitial) {
            setLoading(true);
        } else {
            if (loadingMore || !hasMore) {
                return;
            }
            setLoadingMore(true);
        }

        const currentPage = isInitial ? 1 : page;
        const query = buildQueryString({
            page: currentPage,
            limit: PAGE_LIMIT,
            type: fileTypeRef.current || undefined,
        });

        const { data: response, error: fetchError } = await GetRequest<ChannelFilesResponse>(
            `/channels/${channelId}/files?${query}`,
        );

        if (!fetchError && response) {
            const flattened = normalizeChannelFilesData(response.data);
            const pagination = response.pagination;
            const currentPageNum = Number(pagination?.current_page ?? currentPage);
            const totalPages = Number(
                pagination?.total_pages ??
                pagination?.total_pages_count ??
                1,
            );

            let updatedList: ChannelFileMediaItem[];
            if (isInitial) {
                updatedList = flattened;
            } else {
                const existingIds = new Set(filesRef.current.map((item) => item.id));
                const newItems = flattened.filter((item) => !existingIds.has(item.id));
                updatedList = [...filesRef.current, ...newItems];
            }

            setFiles(updatedList);
            setError(null);

            if (pagination) {
                setHasMore(currentPageNum < totalPages);
                setPage(currentPageNum + 1);
            } else {
                setHasMore(flattened.length >= PAGE_LIMIT);
                setPage(isInitial ? 2 : page + 1);
            }
        } else {
            setError(fetchError || 'Failed to load channel files');
            if (isInitial) {
                setFiles([]);
                setHasMore(false);
            }
        }

        setLoading(false);
        setLoadingMore(false);
    }, [channelId, hasMore, loadingMore, page]);

    useEffect(() => {
        if (!channelId) {
            setFiles([]);
            return;
        }

        setPage(1);
        setHasMore(true);
        fetchFiles(true);
    }, [channelId, fileType]);

    const refresh = useCallback(() => {
        setPage(1);
        setHasMore(true);
        fetchFiles(true);
    }, [fetchFiles]);

    const loadMore = useCallback(() => {
        if (!loading && !loadingMore && hasMore && files.length > 0) {
            fetchFiles(false);
        }
    }, [files.length, fetchFiles, hasMore, loading, loadingMore]);

    return {
        files,
        loading,
        loadingMore,
        hasMore,
        error,
        refresh,
        loadMore,
    };
};
