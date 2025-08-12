/*
Calculadora de Despesas - Versão Avançada (React + Tailwind)

Instruções:
1) Crie o projeto React (Create React App ou Vite). Exemplo com CRA:
   npx create-react-app calculadora-despesas
   cd calculadora-despesas

2) Instale dependências:
   npm install date-fns xlsx file-saver

3) Substitua o conteúdo de src/App.jsx pelo componente abaixo.
   Substitua src/index.css por import do Tailwind ou use o CSS global de sua preferência.

4) Rodar:
   npm start

O que o componente faz:
- Calendário mensal navegável (anterior/proximo mês)
- Clicar num dia abre painel (modal lateral) para inserir despesas com: Classificação, Valor (formatado em moeda), Prioridade
- Mostra um resumo rápido por dia (total) no calendário
- Botão "Gerar Relatório Mensal de Despesas" gera e baixa uma planilha Excel (.xlsx) com todas as despesas do mês

Dependências usadas:
- date-fns -> manipulação de datas
- xlsx (SheetJS) -> geração de arquivo .xlsx
- file-saver -> salvar arquivo no cliente

*/

import React, { useMemo, useState } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, addMonths, subMonths, isSameMonth, isSameDay } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function App() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState(null); // Date object
  const [expenses, setExpenses] = useState({}); // {'YYYY-MM-DD': [{classification, valueNumber, priority}]}
  const [form, setForm] = useState({ classification: "", valueInput: "", priority: "Média" });

  // Formatter for currency
  const currencyFormatter = useMemo(() => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }), []);

  // Build calendar grid for current month
  const monthGrid = useMemo(() => {
    const startMonth = startOfMonth(currentMonth);
    const endMonth = endOfMonth(currentMonth);
    const startDate = startOfWeek(startMonth, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(endMonth, { weekStartsOn: 0 });

    const rows = [];
    let day = startDate;
    while (day <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      rows.push(week);
    }
    return rows; // array of weeks, each week is array of dates
  }, [currentMonth]);

  // Helpers
  function keyForDate(date) {
    return format(date, "yyyy-MM-dd");
  }

  function getTotalForDate(date) {
    const key = keyForDate(date);
    const arr = expenses[key] || [];
    return arr.reduce((s, e) => s + (Number(e.valueNumber) || 0), 0);
  }

  // Currency input handler: valueInput stores digits as formatted string like "R$ 1.234,56".
  // We'll allow user to type numbers and convert to cents.
  function handleValueChange(raw) {
    // Remove everything except digits
    const onlyDigits = raw.replace(/[^0-9]/g, "");
    // Interpret last two digits as cents
    const numberValue = onlyDigits === "" ? 0 : parseInt(onlyDigits, 10) / 100;

    setForm((f) => ({ ...f, valueInput: numberValue === 0 ? "" : currencyFormatter.format(numberValue) }));
  }

  function numericFromValueInput(valueInput) {
    if (!valueInput) return 0;
    // Remove non-digits except comma and dot
    const cleaned = valueInput.replace(/[^0-9,.-]/g, "").replace(/\./g, "");
    // Replace comma with dot for parseFloat
    const normalized = cleaned.replace(/,/g, ".");
    const v = parseFloat(normalized);
    return isNaN(v) ? 0 : v;
  }

  function openForDate(date) {
    setSelectedDate(date);
    setForm({ classification: "", valueInput: "", priority: "Média" });
  }

  function addExpense() {
    if (!selectedDate) return;
    if (!form.classification || !form.valueInput) {
      alert("Preencha classificação e valor.");
      return;
    }
    const valueNumber = numericFromValueInput(form.valueInput);
    if (valueNumber <= 0) {
      alert("Digite um valor válido maior que 0.");
      return;
    }
    const key = keyForDate(selectedDate);
    const newItem = { classification: form.classification, valueNumber, priority: form.priority };
    setExpenses((prev) => ({ ...prev, [key]: [...(prev[key] || []), newItem] }));
    // limpar form
    setForm({ classification: "", valueInput: "", priority: "Média" });
    // opcional: manter modal aberto para adicionar mais
  }

  function deleteExpense(dateKey, idx) {
    setExpenses((prev) => {
      const arr = (prev[dateKey] || []).slice();
      arr.splice(idx, 1);
      const copy = { ...prev };
      if (arr.length === 0) delete copy[dateKey];
      else copy[dateKey] = arr;
      return copy;
    });
  }

  function gerarRelatorioMensal() {
    // gerar array de linhas: Data, Classificação, Valor, Prioridade
    const rows = [];
    const monthKey = format(currentMonth, "yyyy-MM");
    Object.keys(expenses).forEach((dateKey) => {
      if (dateKey.startsWith(monthKey)) {
        const arr = expenses[dateKey];
        arr.forEach((e) => {
          rows.push({ Data: dateKey, Classificacao: e.classification, Valor: e.valueNumber, Prioridade: e.priority });
        });
      }
    });

    if (rows.length === 0) {
      alert("Não há despesas neste mês para gerar relatório.");
      return;
    }

    // Prepare worksheet
    const worksheetData = [ ["Data", "Classificação", "Valor (BRL)", "Prioridade"] ];
    rows.forEach((r) => worksheetData.push([r.Data, r.Classificacao, r.Valor, r.Prioridade]));

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Format the Valor column as currency (Excel numeric)
    // We can convert text to number and set cell.z to currency format
    for (let R = 1; R <= rows.length; ++R) {
      const cellAddress = `C${R + 0}`; // C1 is header, data starts at row 2 => R=1 -> C2
      const cell = ws[cellAddress];
      if (cell) {
        // convert to number
        cell.v = Number(cell.v);
        cell.t = "n";
        cell.z = 'R$ #,##0.00';
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Despesas");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, `despesas_${format(currentMonth, "yyyy-MM")}.xlsx`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <header className="rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-500 text-white p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">Calculadora de Despesas</h1>
              <p className="text-sm opacity-90">Organize suas despesas por dia e exporte uma planilha mensal</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="px-3 py-2 rounded-md bg-white/20 hover:bg-white/30"
              >
                ◀
              </button>
              <div className="text-right">
                <div className="text-sm">Mês atual</div>
                <div className="font-semibold">{format(currentMonth, "MMMM yyyy")}</div>
              </div>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="px-3 py-2 rounded-md bg-white/20 hover:bg-white/30"
              >
                ▶
              </button>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500">
              <div>Dom</div>
              <div>Seg</div>
              <div>Ter</div>
              <div>Qua</div>
              <div>Qui</div>
              <div>Sex</div>
              <div>Sáb</div>
            </div>

            <div className="mt-3 grid grid-rows-6 gap-2">
              {monthGrid.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-2">
                  {week.map((day) => {
                    const inMonth = isSameMonth(day, currentMonth);
                    const key = keyForDate(day);
                    const total = getTotalForDate(day);
                    return (
                      <div
                        key={key}
                        onClick={() => openForDate(day)}
                        className={`cursor-pointer rounded-lg p-3 flex flex-col justify-between h-28 transition-shadow ${inMonth ? 'bg-white shadow-sm' : 'bg-gray-100'} ${isSameDay(day, today) ? 'ring-2 ring-indigo-300' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className={`text-sm ${inMonth ? 'text-gray-700' : 'text-gray-400'}`}>{format(day, "d")}</div>
                          {total > 0 && <div className="text-xs font-semibold text-amber-600">{currencyFormatter.format(total)}</div>}
                        </div>

                        <div className="mt-2 text-xs text-gray-500 overflow-auto">
                          {(expenses[key] || []).slice(0,3).map((e, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <div className="truncate max-w-[120px]">{e.classification}</div>
                              <div className="ml-2">{currencyFormatter.format(e.valueNumber)}</div>
                            </div>
                          ))}
                          {(expenses[key] || []).length > 3 && <div className="text-xs text-gray-400">+{(expenses[key] || []).length - 3} mais</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </section>

          <aside className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Detalhes do Dia</h3>
              <div className="text-sm text-gray-500">{selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Nenhum dia selecionado'}</div>
            </div>

            {selectedDate ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Classificação</label>
                  <input value={form.classification} onChange={(e) => setForm(f => ({...f, classification: e.target.value}))} className="w-full rounded-md border px-3 py-2" placeholder="Ex: Alimentação" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Valor</label>
                  <input
                    value={form.valueInput}
                    onChange={(e) => handleValueChange(e.target.value)}
                    onBlur={(e) => handleValueChange(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Prioridade</label>
                  <select value={form.priority} onChange={(e) => setForm(f => ({...f, priority: e.target.value}))} className="w-full rounded-md border px-3 py-2">
                    <option>Alta</option>
                    <option>Média</option>
                    <option>Baixa</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button onClick={addExpense} className="flex-1 bg-indigo-600 text-white rounded-md px-3 py-2">Adicionar despesa</button>
                  <button onClick={() => setSelectedDate(null)} className="flex-1 border rounded-md px-3 py-2">Fechar</button>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mt-4">Despesas do dia</h4>
                  <div className="mt-2 divide-y">
                    {(expenses[keyForDate(selectedDate)] || []).map((e, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{e.classification}</div>
                          <div className="text-xs text-gray-500">{e.priority}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold">{currencyFormatter.format(e.valueNumber)}</div>
                          <button onClick={() => deleteExpense(keyForDate(selectedDate), idx)} className="text-sm text-red-500">Excluir</button>
                        </div>
                      </div>
                    ))}
                    {!(expenses[keyForDate(selectedDate)] || []).length && <div className="text-xs text-gray-400 py-2">Nenhuma despesa ainda.</div>}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-sm text-gray-500">Clique em um dia do calendário para adicionar despesas.</div>
            )}

            <div className="mt-4">
              <button onClick={gerarRelatorioMensal} className="w-full bg-emerald-600 text-white rounded-md px-3 py-2">Gerar Relatório Mensal de Despesas (Excel)</button>
            </div>

          </aside>
        </main>

      </div>
    </div>
  );
}
