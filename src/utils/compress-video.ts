import { Video } from 'react-native-compressor';

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm'];

type UploadAsset = {
    uri?: string;
    type?: string;
    name?: string;
    fileName?: string;
};

export const isVideoUploadAsset = (asset: UploadAsset): boolean => {
    const mime = (asset.type || '').toLowerCase();
    if (mime.startsWith('video/')) return true;

    const fileName = asset.name || asset.fileName || asset.uri?.split('/').pop() || '';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return VIDEO_EXTENSIONS.includes(ext);
};

export const compressVideoForUpload = async (uri: string): Promise<string> => {
    if (!uri) return uri;

    try {
        const compressedUri = await Video.compress(
            uri,
            {
                compressionMethod: 'auto',
                maxSize: 1024,
                minimumFileSizeForCompress: 0.5,
            },
        );

        return compressedUri || uri;
    } catch (error) {
        console.warn('Video compression failed, uploading original file:', error);
        return uri;
    }
};

export const prepareAssetForUpload = async (asset: UploadAsset) => {
    if (!asset.uri || !isVideoUploadAsset(asset)) {
        return asset;
    }

    const compressedUri = await compressVideoForUpload(asset.uri);
    const fileName = asset.name || asset.fileName || asset.uri.split('/').pop() || 'video.mp4';

    return {
        ...asset,
        uri: compressedUri,
        type: asset.type?.startsWith('video/') ? asset.type : 'video/mp4',
        name: fileName,
    };
};
