import { useEffect, useMemo, useState } from 'react';
import api from '../../shared/services/api';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const COLORS = ['#2563eb', '#14b8a6', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#8b5cf6', '#64748b'];
const REPORT_TYPES = [
  { value: 'executivo', label: 'PDF Executivo' },
  { value: 'completo', label: 'PDF Completo' },
  { value: 'simplificado', label: 'PDF Simplificado' },
  { value: 'financeiro', label: 'PDF Financeiro' },
  { value: 'evento', label: 'PDF Evento' },
  { value: 'estoque', label: 'PDF Estoque' },
  { value: 'clientes', label: 'PDF Clientes' }
];

export default function ReportsPage() {
  const [period, setPeriod] = useState({ start: '', end: '' });
  const [category, setCategory] = useState('');
  const [eventId, setEventId] = useState('');
  const [reportType, setReportType] = useState('completo');
  const [report, setReport] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
  const number = (value) => new Intl.NumberFormat('pt-BR').format(Number(value || 0));
  const dateTime = (value) => value ? new Date(value).toLocaleString('pt-BR') : '';

  const params = () => {
    const data = {};
    if (period.start) data.start = period.start;
    if (period.end) data.end = period.end;
    if (category) data.category = category;
    if (eventId) data.eventId = eventId;
    return data;
  };

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const [reportResponse, eventsResponse] = await Promise.all([
        api.get('/reports/complete', { params: params() }),
        api.get('/events')
      ]);
      setReport(reportResponse.data);
      setEvents(eventsResponse.data.events || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar relatorios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const selectedEvent = events.find((item) => item.id === eventId);
  const periodLabel = period.start || period.end
    ? `${period.start || 'inicio'} ate ${period.end || 'agora'}`
    : 'Todo periodo';

  const productStats = useMemo(() => {
    const totalQuantity = report?.topProducts?.reduce((sum, item) => sum + Number(item.quantidade || 0), 0) || 0;
    const totalRevenue = report?.topProducts?.reduce((sum, item) => sum + Number(item.faturamento || 0), 0) || 0;
    return { totalQuantity, totalRevenue };
  }, [report]);

  const revenueChart = {
    labels: report?.revenueByPeriod?.map((item) => item.period) || [],
    datasets: [{
      label: 'Receita',
      data: report?.revenueByPeriod?.map((item) => item.total) || [],
      backgroundColor: 'rgba(37,99,235,.85)',
      borderRadius: 6
    }]
  };

  const categoryChart = {
    labels: report?.categoryConsumption?.map((item) => item.categoria) || [],
    datasets: [{
      data: report?.categoryConsumption?.map((item) => item.faturamento) || [],
      backgroundColor: report?.categoryConsumption?.map((_, index) => COLORS[index % COLORS.length]) || [],
      borderWidth: 0
    }]
  };

  const flowChart = {
    labels: report?.flow?.map((item) => `${String(item.hour).padStart(2, '0')}h`) || [],
    datasets: [
      { label: 'Entradas', data: report?.flow?.map((item) => item.entries) || [], backgroundColor: 'rgba(20,184,166,.8)', borderRadius: 4 },
      { label: 'Saidas', data: report?.flow?.map((item) => item.exits) || [], backgroundColor: 'rgba(239,68,68,.75)', borderRadius: 4 }
    ]
  };

  const drawPdfTable = (doc, rows, columns, state) => {
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 42;
    const tableWidth = pageWidth - margin * 2;
    const colWidth = tableWidth / columns.length;

    const header = () => {
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, state.y, tableWidth, 28, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      columns.forEach((column, index) => doc.text(column.label, margin + index * colWidth + 8, state.y + 18, { maxWidth: colWidth - 12 }));
      state.y += 28;
    };

    header();
    rows.forEach((row, rowIndex) => {
      if (state.y > pageHeight - 76) {
        doc.addPage();
        state.y = 68;
        header();
      }
      doc.setFillColor(rowIndex % 2 === 0 ? 248 : 255, 250, 252);
      doc.rect(margin, state.y, tableWidth, 30, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      columns.forEach((column, index) => {
        doc.text(String(row[column.key] ?? ''), margin + index * colWidth + 8, state.y + 18, { maxWidth: colWidth - 12 });
      });
      state.y += 30;
    });
    state.y += 18;
  };

  const exportToPDF = async () => {
    if (!report) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const page = { width: 595.28, height: 841.89 };
    const margin = 42;
    const state = { y: 58 };
    const typeLabel = REPORT_TYPES.find((item) => item.value === reportType)?.label || 'Relatorio';

    const addHeader = () => {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, page.width, 62, 'F');
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin, 18, 32, 32, 6, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('CF', margin + 8, 38);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text(typeLabel, margin + 42, 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Gerado em ${dateTime(new Date())} por Administrador`, margin + 42, 44);
      doc.text(selectedEvent ? `Evento: ${selectedEvent.name}` : 'Evento: geral', page.width - margin, 44, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 58, page.width - margin, 58);
    };

    const addFooter = () => {
      const totalPages = doc.internal.getNumberOfPages();
      for (let index = 1; index <= totalPages; index += 1) {
        doc.setPage(index);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, page.height - 44, page.width - margin, page.height - 44);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Comanda Flow - ${dateTime(report.generatedAt)}`, margin, page.height - 26);
        doc.text(`Pagina ${index} / ${totalPages}`, page.width - margin, page.height - 26, { align: 'right' });
      }
    };

    const ensure = (height) => {
      if (state.y + height > page.height - 70) {
        doc.addPage();
        state.y = 76;
        addHeader();
      }
    };

    if (reportType === 'completo') {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, page.width, page.height, 'F');
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(margin, 112, 64, 64, 12, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text('CF', margin + 18, 151);
      doc.setFontSize(28);
      doc.text('Relatorio Completo', margin, 236);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(203, 213, 225);
      doc.text('Comanda Flow - Analise corporativa premium', margin, 260);
      doc.text(`Empresa: Comanda Flow`, margin, 288);
      doc.text(`Periodo: ${periodLabel}`, margin, 308);
      doc.text(`Gerado em: ${dateTime(new Date())}`, margin, 328);
      doc.addPage();
    }

    addHeader();
    state.y = 88;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('Resumo executivo', margin, state.y);
    state.y += 24;

    const cards = [
      ['Receita Total', money(report.executive.receitaTotal)],
      ['Clientes', number(report.executive.quantidadeClientes)],
      ['Pulseiras Emitidas', number(report.executive.pulseirasEmitidas)],
      ['Pulseiras Ativas', number(report.executive.pulseirasAtivas)],
      ['Comandas Fechadas', number(report.executive.comandasFechadas)],
      ['Ticket Medio', money(report.executive.ticketMedio)],
      ['Lucro Estimado', money(report.executive.lucroEstimado)]
    ];

    cards.forEach((card, index) => {
      const x = margin + (index % 2) * 258;
      if (index % 2 === 0 && index > 0) state.y += 64;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, state.y, 246, 52, 8, 8, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(card[0].toUpperCase(), x + 12, state.y + 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(card[1], x + 12, state.y + 38, { maxWidth: 220 });
    });
    state.y += 84;

    if (reportType !== 'simplificado') {
      ensure(90);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Indicadores inteligentes', margin, state.y);
      state.y += 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      report.insights.forEach((insight) => {
        ensure(16);
        doc.text(`- ${insight}`, margin, state.y, { maxWidth: page.width - margin * 2 });
        state.y += 16;
      });
      state.y += 12;
    }

    if (['completo', 'executivo', 'simplificado', 'financeiro', 'evento'].includes(reportType)) {
      ensure(120);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('Produtos mais vendidos', margin, state.y);
      state.y += 16;
      drawPdfTable(
        doc,
        report.topProducts.map((item, index) => ({
          pos: index + 1,
          nome: item.nome,
          qtd: item.quantidade,
          faturamento: money(item.faturamento)
        })),
        [{ key: 'pos', label: '#' }, { key: 'nome', label: 'Produto' }, { key: 'qtd', label: 'Qtd' }, { key: 'faturamento', label: 'Faturamento' }],
        state
      );
    }

    if (['completo', 'clientes'].includes(reportType)) {
      ensure(100);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Clientes com maior consumo', margin, state.y);
      state.y += 16;
      drawPdfTable(
        doc,
        report.topClients.map((item) => ({ nome: item.clienteNome, cpf: item.clienteCpf, visitas: item.visits, consumo: money(item.totalSpent) })),
        [{ key: 'nome', label: 'Cliente' }, { key: 'cpf', label: 'CPF' }, { key: 'visitas', label: 'Visitas' }, { key: 'consumo', label: 'Consumo' }],
        state
      );
    }

    if (['completo', 'estoque'].includes(reportType)) {
      ensure(100);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Estoque critico e baixo', margin, state.y);
      state.y += 16;
      drawPdfTable(
        doc,
        report.lowStock.map((item) => ({ nome: item.nome, categoria: item.categoria, estoque: item.estoque, preco: money(item.preco) })),
        [{ key: 'nome', label: 'Produto' }, { key: 'categoria', label: 'Categoria' }, { key: 'estoque', label: 'Estoque' }, { key: 'preco', label: 'Preco' }],
        state
      );
    }

    if (['completo', 'evento'].includes(reportType) && report.eventComparison.length > 0) {
      ensure(100);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Comparativo entre eventos', margin, state.y);
      state.y += 16;
      drawPdfTable(
        doc,
        report.eventComparison.map((item) => ({ evento: item.name, status: item.status, comandas: item.comandas, total: money(item.total) })),
        [{ key: 'evento', label: 'Evento' }, { key: 'status', label: 'Status' }, { key: 'comandas', label: 'Comandas' }, { key: 'total', label: 'Total' }],
        state
      );
    }

    addFooter();
    doc.save(`comandaflow-${reportType}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportToExcel = async () => {
    if (!report) return;
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([report.executive]), 'Resumo');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(report.topProducts), 'Produtos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(report.topClients), 'Clientes');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(report.categoryConsumption), 'Categorias');
    XLSX.writeFile(wb, `comandaflow-relatorio-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToCSV = () => {
    if (!report) return;
    const rows = [
      ['Produto', 'Categoria', 'Quantidade', 'Faturamento'],
      ...report.topProducts.map((item) => [item.nome, item.categoria, item.quantidade, money(item.faturamento)])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comandaflow-produtos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-slate-500">Relatorios</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Central de relatorios profissionais</h1>
            <p className="mt-1 text-slate-500">PDF premium, Excel, CSV, insights e analise por periodo, categoria e evento.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[170px_170px_170px_190px_auto]">
            <input className="input-field" type="datetime-local" value={period.start} onChange={(e) => setPeriod({ ...period, start: e.target.value })} />
            <input className="input-field" type="datetime-local" value={period.end} onChange={(e) => setPeriod({ ...period, end: e.target.value })} />
            <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Todas categorias</option>
              {[...new Set(report?.categoryConsumption?.map((item) => item.categoria) || [])].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="input-field" value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">Todos eventos</option>
              {events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" onClick={loadReports}>Atualizar</button>
          </div>
        </div>
      </section>

      {error && <div className="panel p-4 text-sm text-rose-600">{error}</div>}

      <section className="grid gap-4 xl:grid-cols-7">
        {report && [
          ['Receita', money(report.executive.receitaTotal)],
          ['Clientes', number(report.executive.quantidadeClientes)],
          ['Pulseiras', number(report.executive.pulseirasEmitidas)],
          ['Ativas', number(report.executive.pulseirasAtivas)],
          ['Fechadas', number(report.executive.comandasFechadas)],
          ['Ticket', money(report.executive.ticketMedio)],
          ['Lucro', money(report.executive.lucroEstimado)]
        ].map(([label, value]) => (
          <div key={label} className="panel p-4">
            <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="panel p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Exportacao</h2>
            <p className="mt-1 text-sm text-slate-500">Escolha o tipo de PDF ou gere planilhas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="input-field w-52" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              {REPORT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <button onClick={exportToPDF} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">Gerar PDF</button>
            <button onClick={exportToExcel} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Excel</button>
            <button onClick={exportToCSV} className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">CSV</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Receita por periodo</h2>
          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
            <Bar data={revenueChart} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }} />
          </div>
          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Mais vendidos no periodo</h3>
                <p className="mt-1 text-sm text-slate-500">{periodLabel} · total {number(productStats.totalQuantity)} item(ns)</p>
              </div>
              <p className="text-sm font-semibold text-slate-950">{money(productStats.totalRevenue)}</p>
            </div>
            <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Produto</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3 text-right">Qtd</th><th className="px-4 py-3 text-right">Faturamento</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {report?.topProducts?.map((item, index) => (
                    <tr key={item.produtoId || item.nome}>
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-950">{item.nome}</td>
                      <td className="px-4 py-3 text-slate-600">{item.categoria}</td>
                      <td className="px-4 py-3 text-right font-semibold">{number(item.quantidade)}</td>
                      <td className="px-4 py-3 text-right">{money(item.faturamento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Consumo por categoria</h2>
            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
              <Doughnut data={categoryChart} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '62%' }} />
            </div>
          </div>
          <div className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Insights</h2>
            <div className="mt-4 space-y-3">
              {report?.insights?.map((item) => <div key={item} className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Fluxo de entrada e saida</h2>
          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
            <Bar data={flowChart} options={{ responsive: true, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }} />
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Comparativo entre eventos</h2>
          <div className="mt-5 space-y-3">
            {report?.eventComparison?.length ? report.eventComparison.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{item.name}</p>
                  <span className="status-chip bg-slate-100 text-slate-700">{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{item.comandas} comanda(s) · {money(item.total)}</p>
              </div>
            )) : <p className="text-sm text-slate-500">Nenhum evento com dados ainda.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
