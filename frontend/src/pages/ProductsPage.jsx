import { useEffect, useState } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ nome: '', preco: '', categoria: '', estoque: '', ativo: true });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editProductId, setEditProductId] = useState(null);

  const resetForm = () => setForm({ nome: '', preco: '', categoria: '', estoque: '', ativo: true });

  const fetchProducts = async () => {
    setLoading(true);
    const response = await api.get('/products');
    setProducts(response.data.products);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      if (editProductId) {
        await api.put(`/products/${editProductId}`, form);
        setMessage('Produto atualizado com sucesso');
      } else {
        await api.post('/products', form);
        setMessage('Produto cadastrado com sucesso');
      }
      resetForm();
      setEditProductId(null);
      await fetchProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erro ao salvar produto');
    }
  };

  const handleEdit = (product) => {
    setEditProductId(product.id);
    setForm({
      nome: product.nome,
      preco: String(product.preco),
      categoria: product.categoria,
      estoque: String(product.estoque),
      ativo: product.ativo
    });
    setMessage('');
  };

  const handleCancelEdit = () => {
    resetForm();
    setEditProductId(null);
    setMessage('Edição cancelada');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja excluir este produto?')) {
      return;
    }
    try {
      await api.delete(`/products/${id}`);
      setMessage('Produto excluído com sucesso');
      await fetchProducts();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erro ao excluir produto');
    }
  };

  const toggleActive = async (id, ativo) => {
    await api.patch(`/products/${id}/active`, { id, ativo });
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">{editProductId ? 'Editar produto' : 'Novo produto'}</h2>
            <p className="text-slate-400">Crie, edite ou exclua produtos do cardápio.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-[1.5rem] bg-brand-600 px-6 py-3 text-white font-semibold transition hover:bg-brand-500"
            >
              {editProductId ? 'Salvar alterações' : 'Salvar produto'}
            </button>
            {editProductId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-[1.5rem] bg-slate-700 px-6 py-3 text-white font-semibold transition hover:bg-slate-600"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr_1fr]">
          <input
            className="input-field"
            placeholder="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Preço"
            value={form.preco}
            onChange={(e) => setForm({ ...form, preco: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Categoria"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Estoque"
            type="number"
            value={form.estoque}
            onChange={(e) => setForm({ ...form, estoque: e.target.value })}
          />
        </form>
        {message && <p className="mt-4 text-slate-300">{message}</p>}
      </div>

      <div className="panel p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Cardápio</h2>
            <p className="text-slate-400">Produtos cadastrados e ações disponíveis.</p>
          </div>
          <span className="status-chip bg-slate-800 text-slate-300">Total: {products.length}</span>
        </div>

        {loading ? (
          <div className="mt-6"><LoadingSpinner /></div>
        ) : products.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-700 bg-slate-950/90 p-8 text-center text-slate-400">
            Nenhum produto cadastrado ainda. Crie um produto usando o formulário acima.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/95 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{product.nome}</p>
                    <p className="mt-1 text-slate-400">{product.categoria}</p>
                    <p className={`mt-3 text-sm ${product.estoque < 10 ? 'text-rose-400' : 'text-slate-400'}`}>
                      Estoque: {product.estoque} {product.estoque < 10 ? '(Baixo)' : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                      className="rounded-full bg-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-600"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <p className="mt-4 text-2xl font-semibold text-white">R$ {Number(product.preco).toFixed(2)}</p>
                <button
                  type="button"
                  onClick={() => toggleActive(product.id, !product.ativo)}
                  className={`mt-4 rounded-full px-4 py-2 text-sm font-semibold ${product.ativo ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'}`}
                >
                  {product.ativo ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
