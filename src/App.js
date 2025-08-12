import { useState } from "react";

function App() {
  const [capital, setCapital] = useState("");
  const [taxa, setTaxa] = useState("");
  const [tempo, setTempo] = useState("");
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const c = parseFloat(capital);
    const i = parseFloat(taxa) / 100;
    const t = parseInt(tempo);
    if (isNaN(c) || isNaN(i) || isNaN(t)) {
      alert("Preencha todos os campos corretamente!");
      return;
    }
    const montante = c * Math.pow(1 + i, t);
    setResultado(montante.toFixed(2));
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>Calculadora Financeira</h2>

      <label>Capital Inicial (R$):</label>
      <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} />

      <label>Taxa de Juros (% ao mês):</label>
      <input type="number" value={taxa} onChange={(e) => setTaxa(e.target.value)} />

      <label>Tempo (meses):</label>
      <input type="number" value={tempo} onChange={(e) => setTempo(e.target.value)} />

      <button onClick={calcular} style={{ marginTop: "10px" }}>
        Calcular
      </button>

      {resultado && (
        <p style={{ marginTop: "20px" }}>
          Montante final: <strong>R$ {resultado}</strong>
        </p>
      )}
    </div>
  );
}

export default App;
