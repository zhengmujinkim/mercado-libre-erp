'use client';
import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
}

interface PublishResult {
  success: boolean;
  itemId?: string;
  permalink?: string;
  message?: string;
  error?: string;
}

export default function PublishPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);

  // Form state
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [condition, setCondition] = useState('new');
  const [freeShipping, setFreeShipping] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Load popular categories
  useEffect(() => {
    const popularCategories: Category[] = [
      { id: 'MLM3474', name: '手机配件' },
      { id: 'MLM3697', name: '耳机/音箱' },
      { id: 'MLM1055', name: '电脑配件' },
      { id: 'MLM1499', name: '智能穿戴' },
      { id: 'MLM2541', name: '家居用品' },
      { id: 'MLM1367', name: '厨房用品' },
      { id: 'MLM3937', name: '个人护理' },
      { id: 'MLM1039', name: '运动户外' },
      { id: 'MLM1743', name: '玩具' },
      { id: 'MLM415001', name: '汽车配件' },
    ];
    setCategories(popularCategories);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(files);

      // Generate previews
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (!category || !title || !price || !stock || images.length === 0) {
      alert('请填写所有必填项并至少上传1张图片');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Convert images to base64
      const imageBase64 = await Promise.all(
        images.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      );

      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: category,
          title,
          description,
          price: parseFloat(price),
          available_quantity: parseInt(stock),
          condition,
          free_shipping: freeShipping,
          images: imageBase64,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setStep(3); // Show success
      }
    } catch (error) {
      setResult({
        success: false,
        error: '网络错误，请重试',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">发布商品</h1>
        <p className="text-gray-600 dark:text-gray-400">一键上架商品到美客多墨西哥站</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
          1
        </div>
        <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
          2
        </div>
        <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
          ✓
        </div>
      </div>
      <div className="flex justify-center mb-8 text-sm text-gray-600 dark:text-gray-400">
        <div className="text-center mx-8">填写信息</div>
        <div className="text-center mx-8">确认发布</div>
        <div className="text-center mx-8">发布成功</div>
      </div>

      {/* Step 1: Form */}
      {step === 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              商品分类 <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">选择分类...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              商品标题 <span className="text-red-500">*</span>（西班牙语，最多60字）
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              placeholder="例: Audífonos Bluetooth Inalámbricos con Micrófono"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/60</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              商品描述（西班牙语）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="描述产品特点、尺寸、材质等..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                售价（墨西哥比索）<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="299"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                库存数量 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="50"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">商品状态</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="new"
                  checked={condition === 'new'}
                  onChange={(e) => setCondition(e.target.value)}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">全新</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="used"
                  checked={condition === 'used'}
                  onChange={(e) => setCondition(e.target.value)}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">二手</span>
              </label>
            </div>
          </div>

          {/* Free Shipping */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={freeShipping}
                onChange={(e) => setFreeShipping(e.target.checked)}
                className="mr-2"
              />
              <span className="text-gray-700 dark:text-gray-300">提供免运费（Mercado Envíos）</span>
            </label>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              商品图片 <span className="text-red-500">*</span>（至少1张，最多12张）
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img src={preview} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                        主图
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setStep(2)}
            disabled={!category || !title || !price || !stock || images.length === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            下一步：确认发布
          </button>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">确认商品信息</h2>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">分类:</span>
              <span className="text-gray-900 dark:text-white font-medium">{categories.find(c => c.id === category)?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">标题:</span>
              <span className="text-gray-900 dark:text-white font-medium text-right max-w-md">{title}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">价格:</span>
              <span className="text-gray-900 dark:text-white font-medium">${price} MXN</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">库存:</span>
              <span className="text-gray-900 dark:text-white font-medium">{stock} 件</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">状态:</span>
              <span className="text-gray-900 dark:text-white font-medium">{condition === 'new' ? '全新' : '二手'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">免运费:</span>
              <span className="text-gray-900 dark:text-white font-medium">{freeShipping ? '是' : '否'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">图片:</span>
              <span className="text-gray-900 dark:text-white font-medium">{images.length} 张</span>
            </div>
          </div>

          {result && !result.success && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 font-medium">发布失败: {result.error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-medium rounded-lg transition-colors"
            >
              返回修改
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-gray-400 transition-colors"
            >
              {loading ? '发布中...' : '确认发布'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && result?.success && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">发布成功！</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">商品已成功上架到美客多墨西哥站</p>

          {result.itemId && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">商品ID:</p>
              <p className="text-gray-900 dark:text-white font-mono mb-3">{result.itemId}</p>
              {result.permalink && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">商品链接:</p>
                  <a
                    href={result.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {result.permalink}
                  </a>
                </>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => {
                setStep(1);
                setResult(null);
                setCategory('');
                setTitle('');
                setDescription('');
                setPrice('');
                setStock('');
                setCondition('new');
                setFreeShipping(true);
                setImages([]);
                setImagePreviews([]);
              }}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              继续发布新商品
            </button>
            <a
              href="/listing"
              className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-medium rounded-lg text-center transition-colors"
            >
              查看商品列表
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
