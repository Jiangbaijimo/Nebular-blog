import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor } from '../core/EditorProvider';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Tooltip } from '../../ui/Tooltip';
import { Loading } from '../../ui/Loading';
import { Dropdown } from '../../ui/Dropdown';
import {
  Image as ImageIcon,
  Crop,
  Palette,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Scissors,
  Sliders,
  Sun,
  Contrast,
  Droplets,
  Zap,
  Filter,
  Eye,
  Settings,
  RefreshCw,
  Check,
  X,
  Move,
  Square,
  Circle,
  Maximize
} from 'lucide-react';

// 图片处理配置接口
interface ImageProcessConfig {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  sepia: number;
  grayscale: number;
  invert: number;
  opacity: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
}

// 裁剪区域接口
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 预设滤镜
interface FilterPreset {
  name: string;
  label: string;
  config: Partial<ImageProcessConfig>;
}

// 图片信息接口
interface ImageInfo {
  width: number;
  height: number;
  size: number;
  type: string;
  name: string;
}

// 图片处理器组件属性
interface ImageProcessorProps {
  className?: string;
  onImageProcessed?: (imageUrl: string, imageInfo: ImageInfo) => void;
}

// 默认处理配置
const defaultConfig: ImageProcessConfig = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  opacity: 100,
  rotation: 0,
  flipX: false,
  flipY: false,
  quality: 90,
  format: 'jpeg'
};

// 预设滤镜
const filterPresets: FilterPreset[] = [
  {
    name: 'original',
    label: '原图',
    config: defaultConfig
  },
  {
    name: 'vintage',
    label: '复古',
    config: {
      brightness: 110,
      contrast: 90,
      saturation: 80,
      sepia: 30,
      hue: 10
    }
  },
  {
    name: 'bw',
    label: '黑白',
    config: {
      grayscale: 100,
      contrast: 110
    }
  },
  {
    name: 'warm',
    label: '暖色调',
    config: {
      brightness: 105,
      saturation: 110,
      hue: 15,
      sepia: 10
    }
  },
  {
    name: 'cool',
    label: '冷色调',
    config: {
      brightness: 95,
      saturation: 110,
      hue: -15,
      contrast: 105
    }
  },
  {
    name: 'dramatic',
    label: '戏剧性',
    config: {
      brightness: 90,
      contrast: 130,
      saturation: 120,
      blur: 0
    }
  },
  {
    name: 'soft',
    label: '柔和',
    config: {
      brightness: 105,
      contrast: 85,
      saturation: 90,
      blur: 1
    }
  },
  {
    name: 'sharp',
    label: '锐化',
    config: {
      brightness: 100,
      contrast: 120,
      saturation: 105
    }
  }
];

// 图片处理器组件
export const ImageProcessor: React.FC<ImageProcessorProps> = ({
  className = '',
  onImageProcessed
}) => {
  const { insertText } = useEditor();
  const [showProcessor, setShowProcessor] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [config, setConfig] = useState<ImageProcessConfig>(defaultConfig);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewMode, setPreviewMode] = useState<'original' | 'processed' | 'split'>('processed');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  // 打开文件选择器
  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 处理文件上传
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setOriginalImage(imageUrl);
      setProcessedImage(imageUrl);
      
      // 获取图片信息
      const img = new Image();
      img.onload = () => {
        setImageInfo({
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type,
          name: file.name
        });
      };
      img.src = imageUrl;
      
      setShowProcessor(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // 应用滤镜
  const applyFilter = useCallback(async (filterConfig: Partial<ImageProcessConfig>) => {
    if (!originalImage || !canvasRef.current) return;

    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // 应用变换
        ctx.save();
        
        // 旋转和翻转
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.translate(centerX, centerY);
        ctx.rotate((filterConfig.rotation || 0) * Math.PI / 180);
        ctx.scale(
          filterConfig.flipX ? -1 : 1,
          filterConfig.flipY ? -1 : 1
        );
        ctx.translate(-centerX, -centerY);

        // 应用CSS滤镜
        const filters = [];
        if (filterConfig.brightness !== undefined) filters.push(`brightness(${filterConfig.brightness}%)`);
        if (filterConfig.contrast !== undefined) filters.push(`contrast(${filterConfig.contrast}%)`);
        if (filterConfig.saturation !== undefined) filters.push(`saturate(${filterConfig.saturation}%)`);
        if (filterConfig.hue !== undefined) filters.push(`hue-rotate(${filterConfig.hue}deg)`);
        if (filterConfig.blur !== undefined) filters.push(`blur(${filterConfig.blur}px)`);
        if (filterConfig.sepia !== undefined) filters.push(`sepia(${filterConfig.sepia}%)`);
        if (filterConfig.grayscale !== undefined) filters.push(`grayscale(${filterConfig.grayscale}%)`);
        if (filterConfig.invert !== undefined) filters.push(`invert(${filterConfig.invert}%)`);
        if (filterConfig.opacity !== undefined) filters.push(`opacity(${filterConfig.opacity}%)`);
        
        ctx.filter = filters.join(' ');
        
        // 绘制图片
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        // 转换为数据URL
        const quality = (filterConfig.quality || 90) / 100;
        const format = filterConfig.format || 'jpeg';
        const dataUrl = canvas.toDataURL(`image/${format}`, quality);
        
        setProcessedImage(dataUrl);
      };
      img.src = originalImage;
    } catch (error) {
      console.error('Filter application failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage]);

  // 更新配置
  const updateConfig = useCallback((updates: Partial<ImageProcessConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    applyFilter(newConfig);
  }, [config, applyFilter]);

  // 应用预设滤镜
  const applyPreset = useCallback((preset: FilterPreset) => {
    const newConfig = { ...defaultConfig, ...preset.config };
    setConfig(newConfig);
    applyFilter(newConfig);
  }, [applyFilter]);

  // 重置配置
  const resetConfig = useCallback(() => {
    setConfig(defaultConfig);
    applyFilter(defaultConfig);
  }, [applyFilter]);

  // 开始裁剪
  const startCrop = useCallback(() => {
    setIsCropping(true);
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
  }, []);

  // 应用裁剪
  const applyCrop = useCallback(() => {
    if (!cropArea || !originalImage || !cropCanvasRef.current) return;

    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const scaleX = img.width / 100;
      const scaleY = img.height / 100;
      
      const cropX = cropArea.x * scaleX;
      const cropY = cropArea.y * scaleY;
      const cropWidth = cropArea.width * scaleX;
      const cropHeight = cropArea.height * scaleY;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setOriginalImage(croppedDataUrl);
      setProcessedImage(croppedDataUrl);
      
      // 更新图片信息
      if (imageInfo) {
        setImageInfo({
          ...imageInfo,
          width: cropWidth,
          height: cropHeight
        });
      }
      
      setIsCropping(false);
      setCropArea(null);
    };
    img.src = originalImage;
  }, [cropArea, originalImage, imageInfo]);

  // 保存图片
  const saveImage = useCallback(() => {
    if (!processedImage || !imageInfo) return;

    const link = document.createElement('a');
    link.download = `processed_${imageInfo.name}`;
    link.href = processedImage;
    link.click();
  }, [processedImage, imageInfo]);

  // 插入到编辑器
  const insertToEditor = useCallback(() => {
    if (!processedImage) return;

    // 这里应该上传图片到服务器并获取URL
    // 暂时使用base64数据
    const markdownImage = `![图片描述](${processedImage})`;
    insertText(markdownImage);
    
    if (onImageProcessed && imageInfo) {
      onImageProcessed(processedImage, imageInfo);
    }
    
    setShowProcessor(false);
  }, [processedImage, imageInfo, insertText, onImageProcessed]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 渲染控制面板
  const renderControls = () => (
    <div className="space-y-4">
      {/* 预设滤镜 */}
      <div>
        <h3 className="text-sm font-medium mb-2">预设滤镜</h3>
        <div className="grid grid-cols-4 gap-2">
          {filterPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-2 text-xs border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 基础调整 */}
      <div>
        <h3 className="text-sm font-medium mb-2">基础调整</h3>
        <div className="space-y-3">
          <div>
            <label className="flex justify-between text-xs">
              <span>亮度</span>
              <span>{config.brightness}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={config.brightness}
              onChange={(e) => updateConfig({ brightness: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="flex justify-between text-xs">
              <span>对比度</span>
              <span>{config.contrast}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={config.contrast}
              onChange={(e) => updateConfig({ contrast: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="flex justify-between text-xs">
              <span>饱和度</span>
              <span>{config.saturation}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={config.saturation}
              onChange={(e) => updateConfig({ saturation: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 高级调整 */}
      {showAdvanced && (
        <div>
          <h3 className="text-sm font-medium mb-2">高级调整</h3>
          <div className="space-y-3">
            <div>
              <label className="flex justify-between text-xs">
                <span>色相</span>
                <span>{config.hue}°</span>
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                value={config.hue}
                onChange={(e) => updateConfig({ hue: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between text-xs">
                <span>模糊</span>
                <span>{config.blur}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={config.blur}
                onChange={(e) => updateConfig({ blur: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between text-xs">
                <span>复古</span>
                <span>{config.sepia}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.sepia}
                onChange={(e) => updateConfig({ sepia: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="flex justify-between text-xs">
                <span>灰度</span>
                <span>{config.grayscale}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.grayscale}
                onChange={(e) => updateConfig({ grayscale: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* 变换 */}
      <div>
        <h3 className="text-sm font-medium mb-2">变换</h3>
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig({ rotation: config.rotation - 90 })}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig({ rotation: config.rotation + 90 })}
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig({ flipX: !config.flipX })}
          >
            <FlipHorizontal className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateConfig({ flipY: !config.flipY })}
          >
            <FlipVertical className="w-4 h-4" />
          </Button>
        </div>
        
        <div>
          <label className="flex justify-between text-xs">
            <span>旋转</span>
            <span>{config.rotation}°</span>
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={config.rotation}
            onChange={(e) => updateConfig({ rotation: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {/* 输出设置 */}
      <div>
        <h3 className="text-sm font-medium mb-2">输出设置</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1">格式</label>
            <select
              value={config.format}
              onChange={(e) => updateConfig({ format: e.target.value as 'jpeg' | 'png' | 'webp' })}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded"
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          
          <div>
            <label className="flex justify-between text-xs">
              <span>质量</span>
              <span>{config.quality}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={config.quality}
              onChange={(e) => updateConfig({ quality: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Tooltip content="图片处理">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFileSelect}
          className={`p-2 ${className}`}
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
      </Tooltip>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 图片处理模态框 */}
      <Modal
        isOpen={showProcessor}
        onClose={() => setShowProcessor(false)}
        title="图片处理"
        size="xl"
      >
        <div className="flex h-[600px]">
          {/* 预览区域 */}
          <div className="flex-1 flex flex-col">
            {/* 预览模式切换 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={previewMode === 'original' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('original')}
                >
                  原图
                </Button>
                <Button
                  variant={previewMode === 'processed' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('processed')}
                >
                  处理后
                </Button>
                <Button
                  variant={previewMode === 'split' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('split')}
                >
                  对比
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {!isCropping ? (
                  <Button variant="outline" size="sm" onClick={startCrop}>
                    <Crop className="w-4 h-4 mr-1" />
                    裁剪
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsCropping(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button variant="primary" size="sm" onClick={applyCrop}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* 图片预览 */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <Loading size="lg" text="处理中..." />
                </div>
              )}
              
              {previewMode === 'split' ? (
                <div className="flex h-full">
                  <div className="flex-1 relative overflow-hidden">
                    <img
                      src={originalImage || ''}
                      alt="原图"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      原图
                    </div>
                  </div>
                  <div className="flex-1 relative overflow-hidden">
                    <img
                      src={processedImage || ''}
                      alt="处理后"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      处理后
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  ref={imageRef}
                  src={previewMode === 'original' ? originalImage || '' : processedImage || ''}
                  alt="预览"
                  className="w-full h-full object-contain"
                />
              )}
              
              {/* 裁剪覆盖层 */}
              {isCropping && cropArea && (
                <div className="absolute inset-0 bg-black bg-opacity-50">
                  <div
                    className="absolute border-2 border-white bg-transparent"
                    style={{
                      left: `${cropArea.x}%`,
                      top: `${cropArea.y}%`,
                      width: `${cropArea.width}%`,
                      height: `${cropArea.height}%`
                    }}
                  >
                    <div className="absolute inset-0 bg-white bg-opacity-20" />
                  </div>
                </div>
              )}
            </div>
            
            {/* 图片信息 */}
            {imageInfo && (
              <div className="mt-4 text-xs text-gray-500 flex items-center gap-4">
                <span>{imageInfo.width} × {imageInfo.height}</span>
                <span>{formatFileSize(imageInfo.size)}</span>
                <span>{imageInfo.type}</span>
              </div>
            )}
          </div>
          
          {/* 控制面板 */}
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 pl-4 ml-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">调整</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={resetConfig}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {renderControls()}
            
            {/* 操作按钮 */}
            <div className="mt-6 space-y-2">
              <Button onClick={insertToEditor} className="w-full">
                插入到编辑器
              </Button>
              <Button variant="outline" onClick={saveImage} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                下载图片
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 隐藏的canvas用于图片处理 */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={cropCanvasRef} className="hidden" />
    </>
  );
};

export default ImageProcessor;