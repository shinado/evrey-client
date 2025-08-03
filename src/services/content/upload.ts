import { UserStorage } from "../../storage";
import { userService } from "../user/user";
import { PostType, PostStatus } from "../../types";
import { contentService } from "./content";
import { eventBus, UploadTask } from "../config/eventBus";
import { getFileExtension } from "../../utils/common";
import { compressImage, compressVideo } from "../../utils";

export interface UploadFileResult {
  success: boolean;
  url?: string;
  error?: Error;
}

export interface UploadOptions {
  fileName: string | string[];
  fileUri: string | string[];
  onProgress?: (progress: number, speed: number) => void;
  onFileFinish?: (fileName: string, success: boolean, url?: string) => void;
}

export interface BatchUploadResult {
  success: boolean;
  results: Array<{
    fileName: string;
    success: boolean;
    url?: string;
    error?: Error;
  }>;
}


export const uploadService = {
  // 处理压缩任务
  async processCompressionTask(task: UploadTask) {
    console.log('Processing compression task 💕');
    try {
      const compressedFiles = await Promise.all(
        task.files.map(async (file) => {
          if (task.type === PostType.VIDEO) {
            // 压缩视频
            const compressed = await compressVideo(file.uri, {
              maxDuration: 15 * 60, // 15分钟
              maxSize: 100, // 100MB
            });
            return {
              ...file,
              uri: compressed.uri,
              thumbnailUri: compressed.thumbnailUri,
            };
          }
          // 压缩图片
          const compressedUri = await compressImage(file.uri, {
            maxWidth: 1080,
            maxSize: 1024 // 1MB
          });
          return {
            ...file,
            uri: compressedUri,
          };
        })
      );

      // 发送压缩完成事件
      eventBus.emit('COMPRESSION_COMPLETE', {
        taskId: task.id,
        files: compressedFiles
      });

      // 开始上传任务
      await this.processUploadTask({
        ...task,
        files: compressedFiles
      });
    } catch (error) {
      console.error('处理压缩任务失败:', error);
      eventBus.emit('COMPRESSION_ERROR', {
        taskId: task.id,
        error: error instanceof Error ? error.message : '压缩失败'
      });
    }
  },

  // 处理上传任务
  async processUploadTask(task: UploadTask) {
    console.log('Processing upload task 💕');
    try {
      let uploadResult: BatchUploadResult;
      let head_img: string;
      let media: { images?: string[]; videos?: string[] };

      if (task.type === PostType.VIDEO) {
        // 处理视频上传
        const video = task.files[0]; // 视频总是第一个
        const extension = getFileExtension(video.uri);
        const videoFileName = `${video._uniqueId}.${extension}`;
        const thumbFileName = `${video._uniqueId}_thumb.jpg`;
        
        uploadResult = await this.uploadFile({
          fileName: [videoFileName, thumbFileName],
          fileUri: [video.uri, video.thumbnailUri as string],
          onProgress: (percent, speed) => {
            eventBus.emit('UPLOAD_PROGRESS', { taskId: task.id, progress: percent });
          },
          onFileFinish: (fileName, success, url) => {
            console.log(`${fileName} 上传${success ? '成功' : '失败'}`, url);
          }
        }) as BatchUploadResult;

        if (!uploadResult.success) {
          throw new Error('upload failed');
        }

        const videoUrl = uploadResult.results.find(r => !r.fileName.includes('_thumb'))?.url as string;
        head_img = uploadResult.results.find(r => r.fileName.includes('_thumb'))?.url as string;
        media = { videos: [videoUrl] };
      } else {
        // 处理图片上传
        const uploadItems = task.files.map(img => {
          const extension = getFileExtension(img.uri);
          const fileName = `${img._uniqueId}.${extension}`;
          return { fileName, fileUri: img.uri };
        });
        
        uploadResult = await this.uploadFile({
          fileName: uploadItems.map(item => item.fileName),
          fileUri: uploadItems.map(item => item.fileUri),
          onProgress: (percent, speed) => {
            eventBus.emit('UPLOAD_PROGRESS', { taskId: task.id, progress: percent });
          },
          onFileFinish: (fileName, success, url) => {
            console.log(`${fileName} 上传${success ? '成功' : '失败'}`, url);
          }
        }) as BatchUploadResult;

        if (!uploadResult.success) {
          throw new Error('upload failed');
        }

        head_img = uploadResult.results[0]?.url || '';
        media = {
          images: uploadResult.results.map(r => r.url as string)
        };
      }

      // 创建帖子
      await contentService.createPost({
        title: task.postInfo.title,
        head_img,
        content: task.postInfo.content,
        type: task.type,
        mint_chain: 'solana',
        mint_address: task.postInfo.mint_address || '',
        media,
        status: PostStatus.Published
      });

      // 发送完成事件
      eventBus.emit('UPLOAD_COMPLETE', {
        taskId: task.id,
        result: { head_img, media }
      });
    } catch (error) {
      console.error('处理上传任务失败:', error);
      // 发送错误事件
      eventBus.emit('UPLOAD_ERROR', {
        taskId: task.id,
        error: error instanceof Error ? error.message : '上传失败'
      });
    }
  },

  // 基础文件上传方法
  async uploadFile(options: UploadOptions): Promise<UploadFileResult | BatchUploadResult> {
    try {
      const isSingleFile = !Array.isArray(options.fileName);
      const fileNames: string[] = isSingleFile ? [options.fileName as string] : options.fileName as string[];
      const fileUris: string[] = isSingleFile ? [options.fileUri as string] : options.fileUri as string[];

      const results: BatchUploadResult['results'] = [];
      const Cos = require("react-native-cos-sdk").default;
      Cos.currentCustomcred = await contentService.getUploadCred(fileNames);
      await Cos.forceInvalidationCredential();
      await Cos.initWithScopeLimitCredentialCallback(async () => ({
        tmpSecretId: Cos.currentCustomcred.credentials.secretId,
        tmpSecretKey: Cos.currentCustomcred.credentials.secretKey,
        startTime: Math.floor(Date.now() / 1000),
        expiredTime: Cos.currentCustomcred.expiredTime,
        sessionToken: Cos.currentCustomcred.credentials.sessionToken,
      }));

      const cosTransferManger = await Cos.registerTransferManger(
        Cos.currentCustomcred.region,
        {
          region: Cos.currentCustomcred.region,
          isDebuggable: true,
        },
        {
          forceSimpleUpload: false,
          enableVerification: true,
          divisionForUpload: 10 * 1024 * 1024, // 设置大于等于 10M 的文件进行分块上传
          sliceSizeForUpload: 5 * 1024 * 1024, //设置默认分块大小为 5M
        }
      );

      // 创建文件上传进度追踪器
      let fileProgresses = 0;
      
      // 并发上传所有文件
      const uploadPromises = fileNames.map((fileName, index) => {
        return new Promise<UploadFileResult>((resolve) => {
          cosTransferManger.upload(
            Cos.currentCustomcred.bucket,
            Cos.currentCustomcred.keys[index],
            fileUris[index],
            {
              resultListener: {
                successCallBack: async (header?: any) => {
                  resolve({ success: true, url: header.accessUrl });
                },
                failCallBack: (clientError?: any, serviceError?: any) => {
                  console.error('Upload failed:', { clientError, serviceError });
                  resolve({
                    success: false,
                    error: new Error(
                      JSON.stringify(clientError || serviceError)
                    ),
                  });
                },
              },
              stateCallback: (state: any) => {
                if (state === "COMPLETED") {
                  // 计算总体进度
                  const totalProgress = ((++fileProgresses) / fileNames.length) * 100;
                  options.onProgress?.(totalProgress, 0);
                }
              },
            }
          );
        });
      });

      // 等待所有文件上传完成
      const uploadResults = await Promise.all(uploadPromises);
      
      // 整理上传结果
      results.push(...uploadResults.map((result, index) => ({
        fileName: fileNames[index],
        ...result
      })));

      // 如果是单个文件，返回单个结果
      if (isSingleFile) {
        const result = results[0];
        return {
          success: result.success,
          url: result.url,
          error: result.error
        };
      }

      return {
        success: results.every(r => r.success),
        results
      };
    } catch (error) {
      console.error('Upload service error:', error);
      const isSingleFile = !Array.isArray(options.fileName);
      const fileNames = Array.isArray(options.fileName) ? options.fileName : [options.fileName];

      if (isSingleFile) {
        return {
          success: false,
          error: error as Error
        };
      }

      return {
        success: false,
        results: fileNames.map(fileName => ({
          fileName,
          success: false,
          error: error as Error
        }))
      };
    }
  },

  // 专门用于上传头像的方法
  async uploadAvatar(
    imageUri: string,
    fileName: string
  ): Promise<UploadFileResult> {
    const result = await this.uploadFile({
      fileName,
      fileUri: imageUri
    }) as UploadFileResult;

    if (result.success && result.url) {
      const info = await UserStorage.getUserInfo();
      if (info?.id) {
        await userService.updateUserInfo(undefined, result.url, undefined);
      }
    }

    return result;
  },
};
