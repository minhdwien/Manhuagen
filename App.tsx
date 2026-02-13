import React, { useState, useEffect } from 'react';
import { Character, AppRoute, CharacterMeasurements, AVAILABLE_MODELS, AspectRatio } from './types';
import { IconHome, IconUsers, IconSettings, IconPlus, IconImage, IconTrash, IconSparkles, IconDownload } from './constants';
import { generateManhuaImage, generateCharacterPreview } from './services/geminiService';

// --- Components ---

const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false, icon = null }: any) => {
  const baseStyle = "flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-brand-600 text-white shadow-lg shadow-brand-900/50 hover:bg-brand-500",
    secondary: "bg-dark-input text-gray-200 border border-gray-700 hover:bg-gray-700",
    danger: "bg-red-900/50 text-red-200 border border-red-900 hover:bg-red-900",
    ghost: "bg-transparent text-gray-400 hover:text-white"
  };

  // Safe fallback for variant
  const variantClass = variants[variant as keyof typeof variants] || variants.primary;

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variantClass} ${className}`}>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = "text", className = "" }: any) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    {label && <label className="text-sm font-medium text-gray-400">{label}</label>}
    <input 
      type={type} 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      className="bg-dark-input border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-brand-500 transition-colors w-full"
    />
  </div>
);

// New Component: Selectable Input Group
const SelectionGroup = ({ label, options, value, onChange, placeholder }: any) => {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-brand-500 uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
              value === opt 
                ? 'bg-brand-600 border-brand-500 text-white shadow-md' 
                : 'bg-dark-input border-gray-700 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder || "Hoặc nhập tùy ý..."}
        className="bg-transparent border-b border-gray-700 p-2 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors w-full"
      />
    </div>
  );
};

// --- Preset Data ---
const PRESETS = {
  age: ["16", "18", "21", "25", "30", "40", "50+"],
  hair: ["Đen dài thẳng", "Đen búi cao", "Trắng bạch kim", "Nâu hạt dẻ", "Đỏ rực", "Tím khói", "Ngắn cá tính"],
  face: ["V-line sắc sảo", "Trái xoan thanh tú", "Tròn bầu bĩnh (Baby)", "Góc cạnh nam tính", "Mắt phượng mày ngài"],
  personality: ["Lạnh lùng (Cool)", "Dịu dàng (Gentle)", "Hoạt bát (Energetic)", "Quyến rũ (Sexy)", "Ngây thơ (Innocent)", "Bá đạo (Domineering)", "Bí ẩn (Mysterious)"],
  eyes: ["Đen láy", "Nâu hổ phách", "Xanh băng giá", "Đỏ huyết", "Vàng kim"],
  skin: ["Trắng sứ", "Trắng hồng", "Ngăm khỏe khoắn", "Vàng nhạt"],
  clothing: ["Y phục cổ trang trắng", "Váy dạ hội đỏ", "Sườn xám hiện đại", "Áo giáp chiến binh", "Đồng phục học sinh", "Vest công sở"],
  accessories: ["Trâm ngọc", "Kiếm cổ", "Quạt giấy", "Khuyên tai dài", "Dây chuyền vàng", "Kính mắt", "Mặt nạ"],
  // Body templates containing measurements
  bodyTypes: {
    Female: [
      { label: "Dáng Chuẩn", h: "165", b: "90", w: "60", hip: "90" },
      { label: "Người Mẫu", h: "175", b: "88", w: "60", hip: "88" },
      { label: "Nhỏ Nhắn (Loli)", h: "150", b: "75", w: "55", hip: "80" },
      { label: "Đầy Đặn (BBW)", h: "160", b: "100", w: "75", hip: "100" },
      { label: "Siêu Vòng 1", h: "168", b: "110", w: "58", hip: "92" },
    ],
    Male: [
      { label: "Chuẩn Soái Ca", h: "180", b: "95", w: "75", hip: "90" },
      { label: "Cơ Bắp", h: "185", b: "110", w: "80", hip: "95" },
      { label: "Thư Sinh", h: "175", b: "85", w: "70", hip: "85" },
    ]
  }
};

const defaultCharacter: Character = {
  id: '',
  name: '',
  gender: 'Female',
  description: '',
  measurements: { height: '165', bust: '90', waist: '60', hip: '90' },
  imageBase64: null
};

const App = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.HOME);
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('manhua_chars');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingChar, setEditingChar] = useState<Character>(defaultCharacter);
  
  // Generation State
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id);
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('manhua_chars', JSON.stringify(characters));
  }, [characters]);

  const handleCreateNewChar = () => {
    setEditingChar({ ...defaultCharacter, id: Date.now().toString() });
    setRoute(AppRoute.CHARACTER_EDIT);
  };

  const handleSaveChar = () => {
    if (!editingChar.name) return;
    
    setCharacters(prev => {
      const exists = prev.find(c => c.id === editingChar.id);
      if (exists) {
        return prev.map(c => c.id === editingChar.id ? editingChar : c);
      }
      return [...prev, editingChar];
    });
    setRoute(AppRoute.CHARACTERS);
  };

  const handleDeleteChar = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân vật này không?")) {
      setCharacters(prev => prev.filter(c => c.id !== id));
      // Remove from selection if deleted
      setSelectedCharIds(prev => prev.filter(cid => cid !== id));
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const activeChars = characters.filter(c => selectedCharIds.includes(c.id));
      const result = await generateManhuaImage(prompt, activeChars, selectedModel);
      setGeneratedImage(result);
    } catch (e: any) {
      setError(e.message || "Tạo ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePreview = async () => {
      setIsGenerating(true);
      try {
          const preview = await generateCharacterPreview(editingChar.description, editingChar.measurements, editingChar.gender);
          setEditingChar(prev => ({...prev, imageBase64: preview}));
      } catch (e: any) {
          alert("Lỗi tạo bản xem trước: " + e.message);
      } finally {
          setIsGenerating(false);
      }
  };

  const toggleCharSelection = (id: string) => {
    setSelectedCharIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // --- Views ---

  const renderHome = () => (
    <div className="p-4 space-y-6 animate-fade-in">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Manhua Studio AI</h1>
        <p className="text-gray-400 text-sm">Sáng tạo truyện tranh với các nhân vật đồng nhất của bạn.</p>
      </header>

      {/* Character Selection */}
      <div>
        <label className="block text-sm font-medium text-brand-400 mb-3 uppercase tracking-wider">Chọn Nhân Vật Trong Cảnh</label>
        {characters.length === 0 ? (
          <div className="p-6 border border-dashed border-gray-700 rounded-xl text-center bg-dark-card/50">
            <p className="text-gray-500 mb-3">Chưa có nhân vật nào</p>
            <Button variant="secondary" onClick={() => setRoute(AppRoute.CHARACTERS)}>+ Tạo Nhân Vật Ngay</Button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {characters.map(char => (
              <div 
                key={char.id}
                onClick={() => toggleCharSelection(char.id)}
                className={`flex-shrink-0 w-20 flex flex-col items-center cursor-pointer transition-all ${selectedCharIds.includes(char.id) ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-80'}`}
              >
                <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 shadow-lg ${selectedCharIds.includes(char.id) ? 'border-brand-500 shadow-brand-500/30' : 'border-gray-700'}`}>
                   {char.imageBase64 ? (
                     <img src={char.imageBase64} alt={char.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-gray-800 flex items-center justify-center text-lg font-bold text-gray-500">{char.name[0]}</div>
                   )}
                   {selectedCharIds.includes(char.id) && (
                    <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                      <div className="bg-brand-500 rounded-full p-1">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    </div>
                   )}
                </div>
                <p className={`text-xs text-center mt-2 truncate w-full font-medium ${selectedCharIds.includes(char.id) ? 'text-brand-400' : 'text-gray-400'}`}>{char.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-brand-400 uppercase tracking-wider">Mô Tả Cảnh</label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Mô tả chi tiết cảnh truyện, hành động và bối cảnh (Ví dụ: Tiểu Long Nữ đang bay trên bầu trời, phía dưới là rừng trúc xanh ngát...)"
            className="w-full h-32 bg-dark-input border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-brand-500 resize-none shadow-inner text-sm leading-relaxed"
          />
          <div className="absolute bottom-3 right-3">
             <IconSparkles className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Action */}
      <Button 
        onClick={handleGenerate} 
        disabled={isGenerating || !prompt} 
        className="w-full py-4 text-lg font-bold shadow-xl shadow-brand-900/30"
        icon={isGenerating ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <IconSparkles />}
      >
        {isGenerating ? "Đang Vẽ Truyện..." : "Tạo Cảnh Manhua"}
      </Button>

      {/* Result */}
      {error && <div className="p-4 bg-red-900/30 border border-red-900/50 text-red-200 rounded-lg text-sm flex items-center gap-2"><span className="text-xl">⚠️</span> {error}</div>}
      
      {generatedImage && (
        <div className="mt-6 space-y-3 animate-fade-in">
          <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-black">
            <img src={generatedImage} alt="Generated" className="w-full h-auto" />
          </div>
          <Button variant="secondary" className="w-full" icon={<IconDownload />} onClick={() => {
              const link = document.createElement('a');
              link.href = generatedImage;
              link.download = `manhua-${Date.now()}.png`;
              link.click();
          }}>
            Tải Xuống Ảnh
          </Button>
        </div>
      )}
    </div>
  );

  const renderCharactersList = () => (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-dark-bg/95 py-2 z-10 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white">Nhân Vật Của Tôi</h2>
        <Button onClick={handleCreateNewChar} variant="primary" icon={<IconPlus />} className="!py-2 !px-3 text-sm">Thêm Mới</Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pb-20">
        {characters.map(char => (
          <div key={char.id} className="bg-dark-card rounded-xl overflow-hidden border border-gray-800 shadow-lg flex flex-col transition-transform active:scale-95">
            <div className="h-40 bg-gray-800 relative">
               {char.imageBase64 ? (
                 <img src={char.imageBase64} alt={char.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-600"><IconUsers className="w-10 h-10 opacity-50" /></div>
               )}
               <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">
                  {char.gender === 'Male' ? 'Nam' : 'Nữ'}
               </div>
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <h3 className="font-bold text-white truncate">{char.name}</h3>
              <p className="text-xs text-gray-400 mb-3">{char.age ? `${char.age} tuổi` : 'Chưa rõ tuổi'}</p>
              <div className="mt-auto flex gap-2">
                <Button 
                  variant="secondary" 
                  className="flex-1 text-xs py-2 px-0 bg-gray-800 hover:bg-gray-700" 
                  onClick={() => { setEditingChar(char); setRoute(AppRoute.CHARACTER_EDIT); }}
                >
                  Sửa
                </Button>
                <Button 
                  variant="danger" 
                  className="w-8 px-0 flex items-center justify-center" 
                  onClick={() => handleDeleteChar(char.id)}
                >
                  <IconTrash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {characters.length === 0 && (
          <div className="col-span-2 text-center py-16 text-gray-600">
            <IconUsers className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Chưa có nhân vật nào được tạo.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCharacterEdit = () => (
    <div className="p-4 pb-24 space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 sticky top-0 bg-dark-bg/95 py-3 z-20 border-b border-gray-800">
        <Button variant="ghost" onClick={() => setRoute(AppRoute.CHARACTERS)} className="!px-2 !py-1 text-gray-400 hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Button>
        <h2 className="text-xl font-bold">{editingChar.id && characters.find(c => c.id === editingChar.id) ? 'Sửa Nhân Vật' : 'Tạo Nhân Vật Mới'}</h2>
      </div>

      <div className="flex gap-4">
        <div className="w-1/3 flex flex-col gap-2">
           <div className="aspect-[2/3] bg-dark-input rounded-xl border border-gray-700 overflow-hidden relative shadow-inner">
              {editingChar.imageBase64 ? (
                  <img src={editingChar.imageBase64} className="w-full h-full object-cover" />
              ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 text-[10px] text-center p-2">
                      <IconUsers className="w-8 h-8 mb-1 opacity-40" />
                      Chưa có ảnh
                  </div>
              )}
           </div>
           <Button 
             variant="secondary" 
             className="w-full text-[10px] py-2" 
             onClick={handleGeneratePreview}
             disabled={isGenerating}
           >
             {isGenerating ? "Đang tạo..." : "Tạo mẫu thử"}
           </Button>
        </div>
        <div className="flex-1 space-y-4">
            <Input 
                label="Tên Nhân Vật" 
                value={editingChar.name} 
                onChange={(e: any) => setEditingChar(prev => ({...prev, name: e.target.value}))} 
                placeholder="VD: Lăng Tiêu..."
            />
            <div className="grid grid-cols-2 gap-2">
                <SelectionGroup 
                    label="Giới Tính" 
                    options={["Nam", "Nữ"]} 
                    value={editingChar.gender === 'Male' ? 'Nam' : editingChar.gender === 'Female' ? 'Nữ' : 'Khác'}
                    onChange={(val: any) => setEditingChar(prev => ({...prev, gender: val === 'Nam' ? 'Male' : 'Female'}))}
                />
                 <SelectionGroup 
                    label="Tuổi" 
                    options={PRESETS.age} 
                    value={editingChar.age || ''}
                    onChange={(val: any) => setEditingChar(prev => ({...prev, age: val}))}
                />
            </div>
        </div>
      </div>

      <SelectionGroup 
        label="Kiểu Tóc" 
        options={PRESETS.hair} 
        value={editingChar.hairStyle || ''}
        onChange={(val: any) => setEditingChar(prev => ({...prev, hairStyle: val}))}
      />

      <SelectionGroup 
        label="Thần Thái / Tính Cách" 
        options={PRESETS.personality} 
        value={editingChar.personality || ''}
        onChange={(val: any) => setEditingChar(prev => ({...prev, personality: val}))}
      />
      
      <SelectionGroup 
        label="Dáng Người (Chọn nhanh)" 
        options={PRESETS.bodyTypes[editingChar.gender === 'Male' ? 'Male' : 'Female']?.map((b: any) => b.label) || []}
        value=""
        placeholder="Chọn mẫu hoặc nhập số đo bên dưới..."
        onChange={(val: string) => {
            const preset = PRESETS.bodyTypes[editingChar.gender === 'Male' ? 'Male' : 'Female']?.find((b: any) => b.label === val);
            if (preset) {
                setEditingChar(prev => ({
                    ...prev,
                    measurements: { height: preset.h, bust: preset.b, waist: preset.w, hip: preset.hip }
                }));
            }
        }}
      />

      <div className="bg-dark-card p-4 rounded-xl border border-gray-800">
        <label className="text-sm font-medium text-brand-400 uppercase tracking-wider mb-3 block">Số đo chi tiết (cm)</label>
        <div className="grid grid-cols-4 gap-2">
           <Input label="Cao" value={editingChar.measurements.height} onChange={(e: any) => setEditingChar(prev => ({...prev, measurements: {...prev.measurements, height: e.target.value}}))} />
           <Input label="V1" value={editingChar.measurements.bust} onChange={(e: any) => setEditingChar(prev => ({...prev, measurements: {...prev.measurements, bust: e.target.value}}))} />
           <Input label="V2" value={editingChar.measurements.waist} onChange={(e: any) => setEditingChar(prev => ({...prev, measurements: {...prev.measurements, waist: e.target.value}}))} />
           <Input label="V3" value={editingChar.measurements.hip} onChange={(e: any) => setEditingChar(prev => ({...prev, measurements: {...prev.measurements, hip: e.target.value}}))} />
        </div>
      </div>

      <SelectionGroup 
        label="Trang Phục" 
        options={PRESETS.clothing} 
        value={editingChar.clothingStyle || ''}
        onChange={(val: any) => setEditingChar(prev => ({...prev, clothingStyle: val}))}
      />
      
      <div className="pt-4">
        <Button className="w-full py-4 text-lg font-bold" onClick={handleSaveChar}>Lưu Nhân Vật</Button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-4 space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold mb-4">Cài Đặt</h2>
      
      <div className="bg-dark-card p-4 rounded-xl border border-gray-800">
        <label className="block text-sm font-medium text-brand-400 mb-3 uppercase tracking-wider">Model AI</label>
        <div className="space-y-3">
           {AVAILABLE_MODELS.map(model => (
             <div 
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                    selectedModel === model.id ? 'bg-brand-900/20 border-brand-500' : 'bg-dark-input border-gray-700 hover:border-gray-600'
                }`}
             >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedModel === model.id ? 'border-brand-500' : 'border-gray-500'}`}>
                    {selectedModel === model.id && <div className="w-2 h-2 bg-brand-500 rounded-full" />}
                </div>
                <div>
                    <div className="font-medium text-white text-sm">{model.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{model.description}</div>
                </div>
             </div>
           ))}
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-600 mt-8">
        Manhua Studio AI v1.4.0
      </div>
    </div>
  );

  return (
    <div className="bg-dark-bg min-h-screen text-white font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-gray-900">
       {/* Main Content Area */}
       <div className="h-screen overflow-y-auto scrollbar-hide">
         {route === AppRoute.HOME && renderHome()}
         {route === AppRoute.CHARACTERS && renderCharactersList()}
         {route === AppRoute.CHARACTER_EDIT && renderCharacterEdit()}
         {route === AppRoute.SETTINGS && renderSettings()}
         <div className="h-24"></div> {/* Bottom spacer */}
       </div>

       {/* Bottom Navigation */}
       <div className="absolute bottom-0 left-0 right-0 bg-dark-card/95 backdrop-blur-md border-t border-gray-800 flex justify-around p-3 z-50">
          <button onClick={() => setRoute(AppRoute.HOME)} className={`flex flex-col items-center gap-1 transition-colors ${route === AppRoute.HOME ? 'text-brand-500' : 'text-gray-500'}`}>
            <IconHome className="w-6 h-6" />
            <span className="text-[10px] font-medium">Xưởng Vẽ</span>
          </button>
          <button onClick={() => setRoute(AppRoute.CHARACTERS)} className={`flex flex-col items-center gap-1 transition-colors ${route === AppRoute.CHARACTERS ? 'text-brand-500' : 'text-gray-500'}`}>
            <IconUsers className="w-6 h-6" />
            <span className="text-[10px] font-medium">Nhân Vật</span>
          </button>
          <button onClick={() => setRoute(AppRoute.SETTINGS)} className={`flex flex-col items-center gap-1 transition-colors ${route === AppRoute.SETTINGS ? 'text-brand-500' : 'text-gray-500'}`}>
            <IconSettings className="w-6 h-6" />
            <span className="text-[10px] font-medium">Cài Đặt</span>
          </button>
       </div>
    </div>
  );
};

export default App;