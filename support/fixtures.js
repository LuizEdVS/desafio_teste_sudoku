import assert from 'node:assert/strict';
import { SudokuBinario } from '../src/sudoku.js';

// Resultado esperado fixo; não é calculado pelo solucionador nos testes.
export const SOLUCAO = [
  [0, 0, 1, 0, 1, 1],
  [0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0],
  [0, 1, 0, 0, 1, 1],
  [1, 0, 1, 1, 0, 0],
  [1, 1, 0, 1, 0, 0],
];

export const DESAFIO = [
  [null, null, 1, null, null, null],
  [null, 1, null, null, null, null],
  [null, null, 1, null, null, 0],
  [0, null, null, 0, null, null],
  [1, null, null, null, 0, 0],
  [null, null, 0, null, 0, 0],
];

export const copiar = valor => structuredClone(valor);
export const transpor = grade => Array.from({ length: 6 }, (_, c) => grade.map(linha => linha[c]));

export function vazio() {
  return Array.from({ length: 6 }, () => [null, null, null, null, null, null]);
}

export function novoJogo() {
  return new SudokuBinario({ tabuleiro: copiar(DESAFIO) });
}

export function semSolucao() {
  const grade = copiar(DESAFIO);
  grade[0][0] = 1;
  return grade;
}

export function quaseCompleto() {
  const grade = copiar(SOLUCAO);
  grade[0][0] = null;
  return grade;
}

export function concluir(jogo) {
  for (let l = 0; l < 6; l += 1) {
    for (let c = 0; c < 6; c += 1) {
      if (!jogo.estado.fixas[l][c]) jogo.preencher(l, c, SOLUCAO[l][c]);
    }
  }
  assert.equal(jogo.estado.status, 'concluido');
}

export function rejeitaSemAlterar(jogo, acao, mensagem) {
  const antes = jogo.estado;
  assert.throws(acao, mensagem);
  assert.deepEqual(jogo.estado, antes);
}
