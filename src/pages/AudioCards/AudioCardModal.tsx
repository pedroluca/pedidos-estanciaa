import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Music, ListMusic, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface AudioCardModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

interface Telemensagem {
  id: number;
  title: string;
  category: string;
  audio_path: string;
}

export function AudioCardModal({ onClose, onSuccess, initialData }: AudioCardModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'catalog'>('upload');
  const [telemensagens, setTelemensagens] = useState<Telemensagem[]>([]);
  const [selectedTelemensagem, setSelectedTelemensagem] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const normalizeText = (text: string) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  const filteredTelemensagens = telemensagens.filter(msg => 
    normalizeText(msg.title).includes(normalizeText(searchTerm)) ||
    normalizeText(msg.category).includes(normalizeText(searchTerm))
  );
  
  const [formData, setFormData] = useState({
    sender_name: '',
    receiver_name: '',
    sender_phone: '',
    receiver_phone: '',
    order_code: ''
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        sender_name: initialData.sender_name,
        receiver_name: initialData.receiver_name,
        sender_phone: initialData.sender_phone || '',
        receiver_phone: initialData.receiver_phone || '',
        order_code: initialData.order_code || ''
      });
      // Note: We can't pre-fill file inputs, but we can show current status if needed
    }
    fetchTelemensagens();
  }, [initialData]);

  const fetchTelemensagens = async () => {
    try {
      const response = await fetch('https://estanciaa.app.br/api/telemensagens');
      const data = await response.json();
      if (Array.isArray(data)) {
        setTelemensagens(data);
      }
    } catch (error) {
      console.error('Erro ao carregar telemensagens');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!initialData && activeTab === 'upload' && !audioFile) {
      toast.error('Por favor, selecione um arquivo de áudio');
      return;
    }
    if (activeTab === 'catalog' && !selectedTelemensagem) {
      toast.error('Por favor, selecione uma telemensagem');
      return;
    }

    setIsLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    if (activeTab === 'upload' && audioFile) {
      data.append('audio', audioFile);
    } else if (activeTab === 'catalog' && selectedTelemensagem) {
      data.append('telemensagem_id', selectedTelemensagem.toString());
    }

    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      const url = initialData 
        ? `https://estanciaa.app.br/api/audio-cards/${initialData.id}`
        : 'https://estanciaa.app.br/api/audio-cards';
      
      if (initialData) {
        data.append('_method', 'PUT');
      }

      const method = initialData ? 'POST' : 'POST'; // Always POST for file uploads

      const response = await fetch(url, {
        method: method,
        body: data,
        // headers: { 'X-HTTP-Method-Override': 'PUT' } // Alternative
      });

      if (response.ok) {
        toast.success(initialData ? 'Cartão atualizado!' : 'Cartão criado!');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao salvar cartão');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">
            {initialData ? 'Editar Cartão' : 'Novo Cartão de Áudio'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">De (Remetente)</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                value={formData.sender_name}
                onChange={e => setFormData({...formData, sender_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Para (Destinatário)</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                value={formData.receiver_name}
                onChange={e => setFormData({...formData, receiver_name: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Telefone Remetente</label>
              <input
                type="tel"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                value={formData.sender_phone}
                onChange={e => setFormData({...formData, sender_phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Telefone Destinatário</label>
              <input
                type="tel"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                value={formData.receiver_phone}
                onChange={e => setFormData({...formData, receiver_phone: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Código do Pedido (Opcional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
              value={formData.order_code}
              onChange={e => setFormData({...formData, order_code: e.target.value})}
            />
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <label className="block text-sm font-medium text-zinc-300 mb-3">Áudio da Mensagem</label>
            
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2
                  ${activeTab === 'upload' 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
              >
                <Upload size={16} />
                Upload Arquivo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2
                  ${activeTab === 'catalog' 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
              >
                <ListMusic size={16} />
                Selecionar do Catálogo
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-pink-500/50 transition-colors">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={e => setAudioFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="text-zinc-400" size={24} />
                  <span className="text-sm text-zinc-300">
                    {audioFile ? audioFile.name : (initialData ? 'Manter áudio atual ou clique para alterar' : 'Clique para selecionar o áudio')}
                  </span>
                  <span className="text-xs text-zinc-500">MP3, WAV, OGG, M4A</span>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar por título ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 placeholder-zinc-500"
                  />
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {filteredTelemensagens.map(msg => (
                    <div 
                      key={msg.id}
                      onClick={() => setSelectedTelemensagem(msg.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between
                        ${selectedTelemensagem === msg.id 
                          ? 'bg-pink-900/20 border-pink-500' 
                          : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'}`}
                    >
                      <div>
                        <div className="text-sm font-medium text-white">{msg.title}</div>
                        <div className="text-xs text-zinc-400">{msg.category}</div>
                      </div>
                      {selectedTelemensagem === msg.id && <Music size={16} className="text-pink-500" />}
                    </div>
                  ))}
                  {filteredTelemensagens.length === 0 && (
                    <div className="text-center text-zinc-500 py-4 text-sm">
                      Nenhuma mensagem encontrada
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-zinc-300 mb-1">Imagem de Capa (Opcional)</label>
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-pink-500/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] || null)}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="text-zinc-400" size={24} />
                <span className="text-sm text-zinc-300">
                  {imageFile ? imageFile.name : (initialData?.image_path ? 'Manter imagem atual ou clique para alterar' : 'Clique para selecionar a imagem')}
                </span>
                <span className="text-xs text-zinc-500">JPG, PNG, WEBP</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (initialData ? 'Salvar Alterações' : 'Criar Cartão')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
