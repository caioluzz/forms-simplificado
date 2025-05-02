import React, { useState, useCallback } from 'react';
import { Upload, Check, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface FileUploadProps {
  onChange: (files: File[] | null) => void;
  value: File[] | null;
  description: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onChange, value, description }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError("Formato de arquivo inválido. Por favor, envie um arquivo JPG, PNG ou PDF.");
      return false;
    }

    if (file.size > maxSize) {
      setError("Arquivo muito grande. Por favor, envie um arquivo com menos de 5MB.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('Files selected:', files); // Log para debug

    const validFiles = files.filter(validateFile);
    console.log('Valid files:', validFiles); // Log para debug

    if (validFiles.length > 0) {
      const currentFiles = value || [];
      const newFiles = [...currentFiles, ...validFiles].slice(0, 3);
      console.log('New files array:', newFiles); // Log para debug
      onChange(newFiles);
    }
  }, [onChange, value, validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    console.log('Dropped files:', files); // Log para debug

    const validFiles = files.filter(validateFile);
    console.log('Valid dropped files:', validFiles); // Log para debug

    if (validFiles.length > 0) {
      const currentFiles = value || [];
      const newFiles = [...currentFiles, ...validFiles].slice(0, 3);
      console.log('New files array after drop:', newFiles); // Log para debug
      onChange(newFiles);
    }
  }, [onChange, value, validateFile]);

  const removeFile = useCallback((index: number) => {
    if (value) {
      const newFiles = value.filter((_, i) => i !== index);
      console.log('Files after removal:', newFiles); // Log para debug
      onChange(newFiles.length > 0 ? newFiles : null);
      setError(null);
    }
  }, [onChange, value]);

  // Adiciona um useEffect para monitorar mudanças no value
  React.useEffect(() => {
    console.log('FileUpload value changed:', value);
  }, [value]);

  // Adiciona um useEffect para limpar o input file quando necessário
  React.useEffect(() => {
    if (!value || value.length === 0) {
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [value]);

  return (
    <div className="space-y-1 md:space-y-2 w-full">
      <p className="text-xs md:text-sm text-gray-500 mb-1 md:mb-2">{description}</p>

      {(!value || value.length === 0) ? (
        <div
          className={cn(
            "dropzone flex flex-col items-center justify-center animate-fade-in",
            isMobile ? "p-4" : "p-6",
            isDragging ? "border-trenergia-blue bg-trenergia-blue/5" : "border-gray-300",
            error ? "border-red-300 bg-red-50" : ""
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.pdf"
            multiple
          />
          <Upload className={`${isMobile ? 'h-8 w-8 mb-1' : 'h-10 w-10 mb-2'} text-trenergia-blue`} />
          <label
            htmlFor="file-upload"
            className="text-xs md:text-sm font-medium text-trenergia-blue cursor-pointer hover:text-trenergia-lightblue transition-colors"
          >
            Clique para fazer upload
          </label>
          <p className="text-xs text-gray-500 mt-1">ou arraste e solte</p>
          <p className="text-xs text-gray-400 mt-2 md:mt-3">JPG, PNG ou PDF (Máx. 5MB)</p>
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 md:p-3 border border-trenergia-blue/30 rounded-lg bg-trenergia-blue/5 animate-fade-in">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 md:h-5 w-4 md:w-5 text-trenergia-blue" />
                <div className="truncate max-w-[150px] md:max-w-[200px]">
                  <p className="text-xs md:text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                aria-label="Remover arquivo"
              >
                <X className="h-4 md:h-5 w-4 md:w-5 text-gray-500" />
              </button>
            </div>
          ))}
          {value.length < 3 && (
            <div
              className={cn(
                "dropzone flex flex-col items-center justify-center animate-fade-in",
                isMobile ? "p-2" : "p-4",
                isDragging ? "border-trenergia-blue bg-trenergia-blue/5" : "border-gray-300",
                error ? "border-red-300 bg-red-50" : ""
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
              />
              <label
                htmlFor="file-upload"
                className="text-xs font-medium text-trenergia-blue cursor-pointer hover:text-trenergia-lightblue transition-colors"
              >
                Adicionar mais arquivos
              </label>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs md:text-sm text-red-500 mt-1 animate-slide-up">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
