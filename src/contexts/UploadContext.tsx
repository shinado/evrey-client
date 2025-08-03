import React, { createContext, useContext, useState, useEffect } from 'react';
import { eventBus, UploadTask, UploadResult } from '../services/config/eventBus';
import { uploadService } from '../services/content/upload';
import { ToastMessage, useToast } from './ToastContext';
import i18n from '../i18n';


const MAX_CONCURRENT_UPLOADS = 3;

interface UploadContextType {
  uploads: Map<string, UploadTask & { progress?: number; status: 'compressing' | 'uploading' | 'complete' | 'error' }>;
}

const UploadContext = createContext<UploadContextType | null>(null);

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploads, setUploads] = useState<Map<string, UploadTask & { progress?: number; status: 'compressing' | 'uploading' | 'complete' | 'error' }>>(new Map());
  const { showToast, hideToast } = useToast();
  const uploadToastRef = React.useRef<null | ((update: Partial<ToastMessage>) => void)>(null);

  useEffect(() => {
    const handleUploadStart = async (task: UploadTask) => {
      console.log('Received the Upload event 💕');
      if (uploads.size >= MAX_CONCURRENT_UPLOADS) {
        showToast('failed', {
          title: i18n.t('toast.uploadFailed'),
          prefix: i18n.t('toast.tooManyUploads')
        });
        return;
      }

      setUploads(prev => new Map(prev).set(task.id, { ...task, progress: 0, status: 'compressing' }));

      // 展示 compressing toast
      uploadToastRef.current = showToast(
        'processing',
        {
          message: i18n.t('toast.compressing'),
          avatar: task.files[0]?.thumbnailUri || task.files[0]?.uri,
          progress: 0
        },
        undefined,
        'uploading'
      );

      await uploadService.processCompressionTask(task);
    };

    const handleCompressionComplete = ({ taskId, files }: { taskId: string; files: any[] }) => {
      setUploads(prev => {
        const task = prev.get(taskId);
        if (!task) return prev;
        const newUploads = new Map(prev);
        newUploads.set(taskId, { ...task, status: 'uploading' });
        return newUploads;
      });

      if (uploadToastRef.current) {
        uploadToastRef.current({
          message: i18n.t('toast.uploading'),
          progress: 0
        });
      }
    };

    const handleCompressionError = ({ taskId, error }: { taskId: string; error: string }) => {
      if (uploadToastRef.current) {
        uploadToastRef.current({
          message: i18n.t('toast.compressionFailed'),
        });
        setTimeout(() => hideToast(), 3000);
        uploadToastRef.current = null;
      }
      setUploads(prev => {
        const newUploads = new Map(prev);
        newUploads.delete(taskId);
        return newUploads;
      });
    };

    const handleUploadProgress = ({ taskId, progress }: { taskId: string; progress: number }) => {
      setUploads(prev => {
        const task = prev.get(taskId);
        if (!task) return prev;
        const newUploads = new Map(prev);
        newUploads.set(taskId, { ...task, progress });
        return newUploads;
      });
      // 更新 toast 进度
      if (uploadToastRef.current) {
        console.log('Updating the upload progress 💕');
        uploadToastRef.current({ progress });
      }
    };

    const handleUploadComplete = ({ taskId }: { taskId: string; result: UploadResult }) => {
      if (uploadToastRef.current) {
        console.log('Upload complete 💕');
        uploadToastRef.current({
          progress: 100,
          message: i18n.t('toast.uploadSuccess'),
          // 你也可以加 status: 'success'，如果 toast 组件支持
        });
        setTimeout(() => hideToast(), 3000); // 3秒后自动关闭
        uploadToastRef.current = null;
      }
      setUploads(prev => {
        const newUploads = new Map(prev);
        newUploads.delete(taskId);
        return newUploads;
      });
    };

    const handleUploadError = ({ taskId, error }: { taskId: string; error: string }) => {
      if (uploadToastRef.current) {
        console.log('Upload failed 💕');
        uploadToastRef.current({
          message: i18n.t('toast.uploadFailed'),
          // 你也可以加 status: 'failed'
        });
        setTimeout(() => hideToast(), 3000); // 3秒后自动关闭
        uploadToastRef.current = null;
      }
      setUploads(prev => {
        const newUploads = new Map(prev);
        newUploads.delete(taskId);
        return newUploads;
      });
    };

    // 监听所有上传相关事件
    eventBus.on('UPLOAD_START', handleUploadStart);
    eventBus.on('COMPRESSION_COMPLETE', handleCompressionComplete);
    eventBus.on('COMPRESSION_ERROR', handleCompressionError);
    eventBus.on('UPLOAD_PROGRESS', handleUploadProgress);
    eventBus.on('UPLOAD_COMPLETE', handleUploadComplete);
    eventBus.on('UPLOAD_ERROR', handleUploadError);

    return () => {
      eventBus.off('UPLOAD_START', handleUploadStart);
      eventBus.off('COMPRESSION_COMPLETE', handleCompressionComplete);
      eventBus.off('COMPRESSION_ERROR', handleCompressionError);
      eventBus.off('UPLOAD_PROGRESS', handleUploadProgress);
      eventBus.off('UPLOAD_COMPLETE', handleUploadComplete);
      eventBus.off('UPLOAD_ERROR', handleUploadError);
    };
  }, [uploads]);

  return (
    <UploadContext.Provider value={{ uploads }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};

export default UploadProvider; 