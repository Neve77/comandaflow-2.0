import { useEffect, useState } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function ReportsPage() {
  const [period, setPeriod] = useState({ start: '', end: '' });
  const [category, setCategory] = useState('');
  const [report, setReport] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const buildParams = () => {
    const params = {};
    if (period.start) params.start = period.start;
    if (period.end) params.end = period.end;
    if (category) params.category = category;
    return params;
  };

  const loadReports = async () => {
    setLoading(true);
    const params = buildParams();
    const response = await api.get('/reports/sales', { params });
    setReport(response.data);
    const productsResponse = await api.get('/reports/products', { params });
    setProducts(productsResponse.data);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const formatCurrency = (value) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
  const formatDateTime = (value) => new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const reportPeriod = period.start || period.end
    ? `${period.start ? formatDateTime(period.start) : 'Início'} — ${period.end ? formatDateTime(period.end) : 'Atual'}`
    : 'Todo período';
  const categoryLabel = category || 'Todas as categorias';

  const handleSearch = async () => {
    loadReports();
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = 50;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Vendas', margin, y);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y += 24;
    doc.text(`Gerado em: ${formatDateTime(new Date())}`, margin, y);
    y += 16;
    doc.text(`Período: ${reportPeriod}`, margin, y);
    y += 16;
    doc.text(`Categoria: ${categoryLabel}`, margin, y);

    y += 28;
    doc.setDrawColor(100);
    doc.setLineWidth(0.5);
    doc.line(margin, y, 555, y);

    y += 18;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo de vendas', margin, y);

    y += 18;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const summaryLines = [
      [`Total faturado`, formatCurrency(report?.total)],
      [`Comandas fechadas`, `${report?.count || 0}`],
      [`Ticket médio`, formatCurrency(report?.average)]
    ];

    summaryLines.forEach(([label, value]) => {
      doc.text(`${label}:`, margin, y);
      doc.text(value, 320, y);
      y += 16;
    });

    if (products.length > 0) {
      y += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('Top produtos', margin, y);

      y += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Produto', margin, y);
      doc.text('Qtd', 360, y);
      doc.text('Faturamento', 450, y);
      y += 10;
      doc.line(margin, y, 555, y);
      y += 14;

      products.slice(0, 10).forEach((item, index) => {
        doc.text(`${index + 1}. ${item.nome}`, margin, y);
        doc.text(`${item.quantidade}`, 360, y);
        doc.text(formatCurrency(item.faturamento), 450, y);
        y += 16;
        if (y > 760) {
          doc.addPage();
          y = 50;
        }
      });
    }

    y += 24;
    if (y < 760) {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('Relatório gerado pelo sistema ComandaFlow. Os dados são baseados no período selecionado.', margin, y);
    }

    doc.save(`relatorio-vendas-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportToExcel = () => {
    const summarySheet = [
      ['Relatório de Vendas'],
      ['Gerado em', formatDateTime(new Date())],
      ['Período', reportPeriod],
      ['Categoria', categoryLabel],
      [],
      ['Resumo de vendas'],
      ['Total faturado', formatCurrency(report?.total)],
      ['Comandas fechadas', report?.count || 0],
      ['Ticket médio', formatCurrency(report?.average)],
      [],
      ['Top produtos']
    ];

    const productsSheet = [
      ['Nome', 'Quantidade', 'Faturamento'],
      ...products.map((item) => [item.nome, item.quantidade, formatCurrency(item.faturamento)])
    ];

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet(summarySheet);
    const wsProducts = XLSX.utils.aoa_to_sheet(productsSheet);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Top Produtos');
    wb.Props = {
      Title: 'Relatório de Vendas',
      Subject: 'Resumo de vendas e top produtos',
      Author: 'ComandaFlow',
      CreatedDate: new Date()
    };

    XLSX.writeFile(wb, `relatorio-vendas-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToCSV = () => {
    const rows = [
      ['Relatório de Vendas'],
      ['Gerado em', formatDateTime(new Date())],
      ['Período', reportPeriod],
      ['Categoria', categoryLabel],
      [],
      ['Resumo de vendas'],
      ['Total faturado', formatCurrency(report?.total)],
      ['Comandas fechadas', report?.count || 0],
      ['Ticket médio', formatCurrency(report?.average)],
      [],
      ['Top produtos'],
      ['Nome', 'Quantidade', 'Faturamento'],
      ...products.map((item) => [item.nome, item.quantidade, formatCurrency(item.faturamento)])
    ];

    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-vendas-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Relatórios</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Análises de vendas</h2>
            <p className="mt-1 text-slate-400">Filtro por período e categoria para encontrar o que importa.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_auto]">
            <input
              className="input-field"
              type="datetime-local"
              value={period.start}
              onChange={(e) => setPeriod({ ...period, start: e.target.value })}
            />
            <input
              className="input-field"
              type="datetime-local"
              value={period.end}
              onChange={(e) => setPeriod({ ...period, end: e.target.value })}
            />
            <select
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Pizzas">Pizzas</option>
              <option value="Lanches">Lanches</option>
              <option value="Saladas">Saladas</option>
              <option value="Sobremesas">Sobremesas</option>
              <option value="Acompanhamentos">Acompanhamentos</option>
            </select>
          </div>
          <button
            className="rounded-[1.5rem] bg-brand-600 px-6 py-3 text-white font-semibold transition hover:bg-brand-500"
            onClick={handleSearch}
          >
            Atualizar
          </button>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="panel p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Total de Vendas</p>
          <p className="mt-4 text-4xl font-semibold text-white">R$ {report ? Number(report.total).toFixed(2) : '0.00'}</p>
        </div>
        <div className="panel p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Comandas fechadas</p>
          <p className="mt-4 text-4xl font-semibold text-white">{report?.count || 0}</p>
        </div>
        <div className="panel p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Ticket médio</p>
          <p className="mt-4 text-4xl font-semibold text-white">R$ {report ? Number(report.average).toFixed(2) : '0.00'}</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="panel p-6">
          <h2 className="text-2xl font-semibold text-white">Desempenho visual</h2>
          <p className="mt-2 text-slate-400">Gráfico com as métricas mais importantes.</p>
          <div className="mt-6 rounded-[1.75rem] border border-slate-800/90 bg-slate-950/95 p-4">
            <Bar
              data={{
                labels: ['Total Vendas', 'Comandas', 'Ticket Médio'],
                datasets: [{
                  label: 'Valores',
                  data: [Number(report?.total || 0), report?.count || 0, Number(report?.average || 0)],
                  backgroundColor: ['rgba(59, 130, 246, 0.85)', 'rgba(20, 184, 166, 0.85)', 'rgba(234, 179, 8, 0.85)']
                }]
              }}
            />
          </div>
        </div>
        <div className="panel p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">Top produtos</h2>
            <div className="flex gap-2">
              <button onClick={exportToPDF} className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500">PDF</button>
              <button onClick={exportToExcel} className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Excel</button>
              <button onClick={exportToCSV} className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500">CSV</button>
            </div>
          </div>
          {loading ? (
            <div className="mt-6"><LoadingSpinner /></div>
          ) : products.length > 0 ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/95 p-4">
                <Pie
                  data={{
                    labels: products.map((p) => p.nome),
                    datasets: [{
                      data: products.map((p) => p.quantidade),
                      backgroundColor: ['#7c3aed', '#2563eb', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9']
                    }]
                  }}
                />
              </div>
              <div className="grid gap-3">
                {products.map((item) => (
                  <div key={item.produtoId || item.nome} className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/95 p-4">
                    <p className="font-semibold text-white">{item.nome}</p>
                    <p className="mt-1 text-slate-400">Quantidade: {item.quantidade}</p>
                    <p className="mt-1 text-slate-400">Faturamento: R$ {item.faturamento.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-slate-400">Nenhum produto encontrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}
