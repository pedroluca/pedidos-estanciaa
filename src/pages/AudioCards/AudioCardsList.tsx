import { Plus, Search, Trash2, QrCode, Download, Pencil } from 'lucide-react';
import { AudioCardModal } from './AudioCardModal';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';

interface AudioCard {
  id: number;
  uuid: string;
  sender_name: string;
  receiver_name: string;
  sender_phone: string;
  receiver_phone: string;
  audio_path: string;
  image_path?: string;
  status: string;
  order_code: string;
  created_at: string;
}

export function AudioCardsList() {
  const [cards, setCards] = useState<AudioCard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCard, setEditingCard] = useState<AudioCard | null>(null);
  const [qrCodeCard, setQrCodeCard] = useState<AudioCard | null>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await fetch('https://estanciaa.app.br/api/audio-cards');
      const data = await response.json();
      if (Array.isArray(data)) {
        setCards(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar cartões');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cartão?')) return;

    try {
      const response = await fetch(`https://estanciaa.app.br/api/audio-cards/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Cartão excluído com sucesso');
        fetchCards();
      } else {
        toast.error('Erro ao excluir cartão');
      }
    } catch (error) {
      toast.error('Erro ao excluir cartão');
    }
  };

  const handleEdit = (card: AudioCard) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const filteredCards = cards.filter(card => 
    card.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.receiver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.order_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlayerUrl = (uuid: string) => `https://player.estanciaa.app.br/${uuid}`;

  const downloadQRCode = () => {
    if (!qrCodeRef.current || !qrCodeCard) return;

    const svg = qrCodeRef.current.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        
        const downloadLink = document.createElement('a');
        downloadLink.download = `qrcode-${qrCodeCard.sender_name}-${qrCodeCard.receiver_name}.png`;
        downloadLink.href = pngFile;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Cartões de Áudio</h1>
        <button
          onClick={() => {
            setEditingCard(null);
            setIsModalOpen(true);
          }}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Novo Cartão
        </button>
      </div>

      <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por remetente, destinatário ou pedido..."
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
                <th className="p-4">ID</th>
                <th className="p-4">De / Para</th>
                <th className="p-4">Telefones</th>
                <th className="p-4">Pedido</th>
                <th className="p-4">Áudio</th>
                <th className="p-4">Capa</th>
                <th className="p-4">QR Code</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">Carregando...</td>
                </tr>
              ) : filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">Nenhum cartão encontrado</td>
                </tr>
              ) : (
                filteredCards.map(card => (
                  <tr key={card.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 text-zinc-500">#{card.id}</td>
                    <td className="p-4">
                      <div className="font-medium text-white">{card.sender_name}</div>
                      <div className="text-sm text-zinc-400">para {card.receiver_name}</div>
                    </td>
                    <td className="p-4 text-sm text-zinc-400">
                      <div>De: {card.sender_phone || '-'}</div>
                      <div>Para: {card.receiver_phone || '-'}</div>
                    </td>
                    <td className="p-4">
                      {card.order_code ? (
                        <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs font-medium">
                          {card.order_code}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <audio controls src={`https://estanciaa.app.br/api/${card.audio_path}`} className="h-8 w-40" />
                    </td>
                    <td className="p-4">
                      {card.image_path ? (
                        <img 
                          src={`https://estanciaa.app.br/api/${card.image_path}`} 
                          alt="Capa" 
                          className="w-10 h-10 rounded object-cover border border-zinc-700"
                        />
                      ) : (
                        <span className="text-zinc-600 text-xs">Sem capa</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => setQrCodeCard(card)}
                        className="text-zinc-400 hover:text-pink-500 transition-colors"
                        title="Ver QR Code"
                      >
                        <QrCode size={20} />
                      </button>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(card)}
                        className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(card.id)}
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
        <AudioCardModal 
          onClose={handleCloseModal} 
          onSuccess={() => {
            handleCloseModal();
            fetchCards();
          }} 
          initialData={editingCard}
        />
      )}

      {qrCodeCard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full text-center shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">QR Code do Cartão</h3>
            <div className="bg-white p-4 rounded-lg inline-block mb-4" ref={qrCodeRef}>
              <QRCodeSVG value={getPlayerUrl(qrCodeCard.uuid)} size={200} />
            </div>
            <p className="text-sm text-zinc-400 mb-6 break-all">
              {getPlayerUrl(qrCodeCard.uuid)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setQrCodeCard(null)}
                className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={downloadQRCode}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Baixar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
