import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Telemensagem {
  id: number;
  title: string;
  category: string;
  audio_path: string;
  created_at: string;
}

export function TelemensagensList() {
  const [messages, setMessages] = useState<Telemensagem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('https://estanciaa.app.br/api/telemensagens');
      const data = await response.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar telemensagens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      toast.error('Selecione um arquivo de áudio');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('audio', audioFile);

    try {
      const response = await fetch('https://estanciaa.app.br/api/telemensagens', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast.success('Telemensagem adicionada com sucesso');
        setIsModalOpen(false);
        setTitle('');
        setCategory('');
        setAudioFile(null);
        fetchMessages();
      } else {
        toast.error('Erro ao adicionar telemensagem');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    try {
      const response = await fetch(`https://estanciaa.app.br/api/telemensagens/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Mensagem excluída');
        fetchMessages();
      } else {
        toast.error('Erro ao excluir mensagem');
      }
    } catch (error) {
      toast.error('Erro ao excluir mensagem');
    }
  };

  const filteredMessages = messages.filter(msg => 
    msg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Catálogo de Telemensagens</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nova Mensagem
        </button>
      </div>

      <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por título ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 placeholder-zinc-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-800 text-zinc-400 font-medium">
              <tr>
                <th className="p-4">Título</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Áudio</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">Carregando...</td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">Nenhuma mensagem encontrada</td>
                </tr>
              ) : (
                filteredMessages.map(msg => (
                  <tr key={msg.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 font-medium text-white">{msg.title}</td>
                    <td className="p-4">
                      <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs border border-zinc-700">
                        {msg.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <audio controls src={`https://estanciaa.app.br/api/${msg.audio_path}`} className="h-8 w-40" />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Nova Telemensagem</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <Trash2 size={20} className="rotate-45" /> {/* Using Trash icon rotated as X for simplicity or import X */}
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Título</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Feliz Aniversário Mãe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Categoria</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Ex: Aniversário, Amor, Amizade"
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
                    id="tele-upload"
                  />
                  <label htmlFor="tele-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="text-zinc-400" size={24} />
                    <span className="text-sm text-zinc-300">
                      {audioFile ? audioFile.name : 'Clique para selecionar o áudio'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
