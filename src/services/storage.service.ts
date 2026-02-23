import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

interface UploadResult {
  url: string;
  path: string;
  name: string;
  size?: number;
  contentType?: string;
}

function logStorage(action: string, data?: any) {
  console.log(`[Storage Service ${new Date().toISOString()}] ${action}:`, data);
}

const storageService = {
  /**
   * Upload an image to Firebase Storage
   * @param uri Local file URI
   * @param caseId Case ID for organizing files
   * @param onProgress Optional progress callback
   * @returns Upload result with download URL
   */
  async uploadImage(
    uri: string,
    caseId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const startTime = Date.now();
    logStorage('UPLOAD_IMAGE_START', { uri, caseId });

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `image_${timestamp}.jpg`;
      const path = `chat/${caseId}/images/${filename}`;

      // Get reference
      const reference = storage().ref(path);

      // Prepare file URI for different platforms
      let fileUri = uri;
      if (Platform.OS === 'ios' && !uri.startsWith('file://')) {
        fileUri = `file://${uri}`;
      }

      logStorage('UPLOADING_IMAGE', { path, fileUri });

      // Upload file
      const task = reference.putFile(fileUri);

      // Monitor progress
      if (onProgress) {
        task.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: Math.round(progress),
          });
        });
      }

      // Wait for upload to complete
      await task;

      // Get download URL
      const url = await reference.getDownloadURL();

      const duration = Date.now() - startTime;
      const metadata = await reference.getMetadata();

      logStorage('UPLOAD_IMAGE_SUCCESS', {
        path,
        url,
        size: metadata.size,
        contentType: metadata.contentType,
        duration: `${duration}ms`,
      });

      return {
        url,
        path,
        name: filename,
        size: metadata.size,
        contentType: metadata.contentType || undefined,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logStorage('UPLOAD_IMAGE_ERROR', {
        uri,
        caseId,
        error: error.message,
        code: error.code,
        duration: `${duration}ms`,
      });
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  },

  /**
   * Upload a document to Firebase Storage
   * @param uri Local file URI
   * @param caseId Case ID for organizing files
   * @param filename Original filename
   * @param onProgress Optional progress callback
   * @returns Upload result with download URL
   */
  async uploadDocument(
    uri: string,
    caseId: string,
    filename: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const startTime = Date.now();
    logStorage('UPLOAD_DOCUMENT_START', { uri, caseId, filename });

    try {
      // Generate unique filename while preserving extension
      const timestamp = Date.now();
      const extension = filename.split('.').pop() || 'bin';
      const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilename = `doc_${timestamp}_${safeName}`;
      const path = `chat/${caseId}/documents/${uniqueFilename}`;

      // Get reference
      const reference = storage().ref(path);

      // Prepare file URI for different platforms
      let fileUri = uri;
      if (Platform.OS === 'ios' && !uri.startsWith('file://')) {
        fileUri = `file://${uri}`;
      }

      logStorage('UPLOADING_DOCUMENT', { path, fileUri });

      // Upload file
      const task = reference.putFile(fileUri);

      // Monitor progress
      if (onProgress) {
        task.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: Math.round(progress),
          });
        });
      }

      // Wait for upload to complete
      await task;

      // Get download URL
      const url = await reference.getDownloadURL();

      const duration = Date.now() - startTime;
      const metadata = await reference.getMetadata();

      logStorage('UPLOAD_DOCUMENT_SUCCESS', {
        path,
        url,
        size: metadata.size,
        contentType: metadata.contentType,
        duration: `${duration}ms`,
      });

      return {
        url,
        path,
        name: filename,
        size: metadata.size,
        contentType: metadata.contentType || undefined,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logStorage('UPLOAD_DOCUMENT_ERROR', {
        uri,
        caseId,
        filename,
        error: error.message,
        code: error.code,
        duration: `${duration}ms`,
      });
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  },

  /**
   * Delete a file from Firebase Storage
   * @param path Storage path of the file
   */
  async deleteFile(path: string): Promise<void> {
    const startTime = Date.now();
    logStorage('DELETE_FILE_START', { path });

    try {
      const reference = storage().ref(path);
      await reference.delete();

      const duration = Date.now() - startTime;
      logStorage('DELETE_FILE_SUCCESS', { path, duration: `${duration}ms` });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logStorage('DELETE_FILE_ERROR', {
        path,
        error: error.message,
        code: error.code,
        duration: `${duration}ms`,
      });
      // Don't throw error - file might already be deleted
      console.warn(`Failed to delete file: ${error.message}`);
    }
  },

  /**
   * Get metadata for a file
   * @param url Download URL or storage path
   */
  async getFileMetadata(url: string): Promise<any> {
    try {
      const reference = storage().refFromURL(url);
      const metadata = await reference.getMetadata();
      return metadata;
    } catch (error: any) {
      logStorage('GET_METADATA_ERROR', { url, error: error.message });
      throw error;
    }
  },
};

export default storageService;
