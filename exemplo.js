import { SudokuBinario, contarSolucoes } from './src/sudoku.js';

function mostrar(jogo) {
  for (const linha of jogo.estado.tabuleiro) {
    console.log(linha.map(valor => valor === null ? '.' : valor).join(' '));
  }
  console.log(`Estado: ${jogo.estado.status}; preenchidas: ${jogo.estado.preenchidas}/36.`);
}

const jogo = new SudokuBinario();
console.log('Sudoku binário 6 × 6. Legenda: . representa uma casa vazia.');
console.log(`Pistas fixas: ${jogo.estado.quantidadePistas}.`);
mostrar(jogo);

try {
  jogo.preencher(4, 3, 0);
} catch (erro) {
  console.log(`\nExemplo de jogada rejeitada: ${erro.message}`);
}

const resultado = contarSolucoes(jogo.estado.tabuleiro);
console.log(`\nSoluções encontradas: ${resultado.quantidade}. Busca completa: ${!resultado.limiteAtingido}.`);
for (let linha = 0; linha < 6; linha += 1) {
  for (let coluna = 0; coluna < 6; coluna += 1) {
    if (!jogo.estado.fixas[linha][coluna]) {
      jogo.preencher(linha, coluna, resultado.primeiraSolucao[linha][coluna]);
    }
  }
}
console.log('\nDesafio preenchido:');
mostrar(jogo);

jogo.reiniciar();
console.log('\nApós reiniciar, permanecem somente as 12 pistas originais:');
mostrar(jogo);
