import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AudioCardModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AudioCardModal({ onClose, onSuccess }: AudioCardModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    sender_name: '',
    receiver_name: '',
    sender_phone: '',
    receiver_phone: '',
    order_code: ''
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) {
      toast.error('Por favor, selecione um arquivo de áudio');
      return;
    }

    setIsLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    data.append('audio', audioFile);

    try {
      const response = await fetch('https://estanciaa.app.br/api/audio-cards', {
        method: 'POST',
        body: data
      });

      if (response.ok) {
        toast.success('Cartão criado com sucesso!');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao criar cartão');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Novo Cartão de Áudio</h2>
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

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Arquivo de Áudio</label>
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
                  {audioFile ? audioFile.name : 'Clique para selecionar o áudio'}
                </span>
                <span className="text-xs text-zinc-500">MP3, WAV, OGG, M4A</span>
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
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Criar Cartão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
