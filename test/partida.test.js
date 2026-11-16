import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SudokuBinario, DESAFIO_PADRAO, avaliarTabuleiro } from '../src/sudoku.js';
import {
  SOLUCAO, DESAFIO, copiar, vazio, transpor, novoJogo, semSolucao, quaseCompleto, concluir, rejeitaSemAlterar,
} from '../support/fixtures.js';

describe('CT08 — Criação da partida e pistas fixas', () => {
  it('inicia o desafio padrão com 12 pistas e 24 casas vazias', () => {
    const jogo = new SudokuBinario();
    assert.equal(jogo.estado.tamanho, 6);
    assert.equal(jogo.estado.totalCasas, 36);
    assert.equal(jogo.estado.status, 'pronto');
    assert.equal(jogo.estado.quantidadePistas, 12);
    assert.equal(jogo.estado.preenchidas, 12);
    assert.equal(jogo.estado.vazias, 24);
    assert.deepEqual(jogo.estado.tabuleiro, DESAFIO);
  });

  it('zero também é uma pista fixa, sem ser confundido com casa vazia', () => {
    const jogo = novoJogo();
    assert.equal(jogo.estado.fixas[2][5], true);
    assert.equal(jogo.estado.tabuleiro[2][5], 0);
    assert.equal(jogo.estado.fixas[0][2], true);
    assert.equal(jogo.estado.fixas[0][0], false);
  });

  it('rejeita formato de tabuleiro incorreto', () => {
    assert.throws(() => new SudokuBinario({ tabuleiro: [] }), /Tabuleiro inválido/);
  });

  it('rejeita pistas que já violam uma regra', () => {
    const grade = vazio();
    grade[0] = [0, 0, 0, null, null, null];
    assert.throws(() => new SudokuBinario({ tabuleiro: grade }), /Tabuleiro inválido/);
  });

  it('rejeita desafios sem solução mesmo quando a validação local aprova', () => {
    for (const exigirSolucaoUnica of [true, false]) {
      assert.throws(() => new SudokuBinario({ tabuleiro: semSolucao(), exigirSolucaoUnica }), /não possui solução/);
    }
  });

  it('exige solução única por padrão', () => {
    assert.throws(() => new SudokuBinario({ tabuleiro: vazio() }), /solução única/);
  });

  it('permite múltiplas soluções quando essa opção é explicitamente habilitada', () => {
    const jogo = new SudokuBinario({ tabuleiro: vazio(), exigirSolucaoUnica: false });
    assert.equal(jogo.estado.status, 'pronto');
    assert.equal(jogo.estado.quantidadePistas, 0);
    assert.equal(jogo.estado.vazias, 36);
  });

  for (const opcao of [null, 'false', 0]) {
    it(`rejeita opção de unicidade que não é booleano: ${JSON.stringify(opcao)}`, () => {
      assert.throws(() => new SudokuBinario({ exigirSolucaoUnica: opcao }), /deve ser booleano/);
    });
  }

  it('aceita uma solução completa e já a identifica como concluída', () => {
    const jogo = new SudokuBinario({ tabuleiro: SOLUCAO });
    assert.equal(jogo.estado.status, 'concluido');
    assert.equal(jogo.estado.preenchidas, 36);
    assert.equal(jogo.estado.quantidadePistas, 36);
  });

  it('copiar as pistas impede alterações externas na partida', () => {
    const grade = copiar(DESAFIO);
    const jogo = new SudokuBinario({ tabuleiro: grade });
    grade[0][2] = 0;
    grade.splice(1);
    assert.deepEqual(jogo.estado.tabuleiro, DESAFIO);
  });

  it('o desafio padrão exportado não permite modificar suas pistas', () => {
    assert.throws(() => { DESAFIO_PADRAO[0][2] = 0; }, TypeError);
    assert.equal(DESAFIO_PADRAO[0][2], 1);
  });
});

describe('CT09 — Preenchimento, correção e rejeição de jogadas', () => {
  for (const valor of [0, 1]) {
    it(`preenche uma casa editável com ${valor} e atualiza o progresso`, () => {
      const jogo = novoJogo();
      const estado = jogo.preencher(0, 0, valor);
      assert.equal(estado.tabuleiro[0][0], valor);
      assert.equal(estado.preenchidas, 13);
      assert.equal(estado.vazias, 23);
      assert.equal(estado.status, 'jogando');
      assert.equal(estado.fixas[0][0], false);
    });
  }

  it('permite trocar um valor do jogador sem contar a casa duas vezes', () => {
    const jogo = novoJogo();
    jogo.preencher(0, 0, 0);
    jogo.preencher(0, 0, 1);
    assert.equal(jogo.estado.tabuleiro[0][0], 1);
    assert.equal(jogo.estado.preenchidas, 13);
  });

  it('repetir o mesmo valor em casa editável é uma operação sem efeito', () => {
    const jogo = novoJogo();
    jogo.preencher(0, 0, 0);
    const antes = jogo.estado;
    assert.deepEqual(jogo.preencher(0, 0, 0), antes);
  });

  it('apaga somente o valor do jogador e restaura a contagem de casas vazias', () => {
    const jogo = novoJogo();
    jogo.preencher(0, 0, 0);
    const estado = jogo.apagar(0, 0);
    assert.equal(estado.tabuleiro[0][0], null);
    assert.equal(estado.preenchidas, 12);
    assert.equal(estado.vazias, 24);
    assert.equal(estado.status, 'jogando');
  });

  it('apagar uma casa já vazia não inicia nem modifica a partida', () => {
    const jogo = novoJogo();
    const antes = jogo.estado;
    assert.deepEqual(jogo.apagar(0, 0), antes);
  });

  for (const [linha, coluna, valor] of [[2, 5, 0], [0, 2, 1]]) {
    it(`bloqueia substituição e remoção de uma pista fixa com valor ${valor}`, () => {
      const jogo = novoJogo();
      rejeitaSemAlterar(jogo, () => jogo.preencher(linha, coluna, 1 - valor), /pista fixa/);
      rejeitaSemAlterar(jogo, () => jogo.preencher(linha, coluna, valor), /pista fixa/);
      rejeitaSemAlterar(jogo, () => jogo.apagar(linha, coluna), /pista fixa/);
    });
  }

  for (const [nome, valor] of [
    ['null', null], ['undefined', undefined], ['dois', 2], ['negativo', -1], ['fracionário', 0.5],
    ['texto zero', '0'], ['texto um', '1'], ['true', true], ['false', false], ['NaN', NaN],
  ]) {
    it(`rejeita jogada com valor ${nome} sem alterar a partida`, () => {
      const jogo = novoJogo();
      rejeitaSemAlterar(jogo, () => jogo.preencher(0, 0, valor), /números 0 ou 1/);
    });
  }

  it('rejeita coordenadas inválidas nos métodos de preencher e apagar', () => {
    const jogo = novoJogo();
    for (const [linha, coluna] of [[-1, 0], [6, 0], [0, -1], [0, 6], [0.5, 0], [0, 0.5], ['0', 0], [0, null]]) {
      rejeitaSemAlterar(jogo, () => jogo.preencher(linha, coluna, 0), /Coordenada inválida/);
      rejeitaSemAlterar(jogo, () => jogo.apagar(linha, coluna), /Coordenada inválida/);
    }
  });

  it('rejeita uma jogada que produz trinca na linha', () => {
    const jogo = novoJogo();
    rejeitaSemAlterar(jogo, () => jogo.preencher(4, 3, 0), /Jogada inválida/);
  });

  it('rejeita uma jogada que produz trinca na coluna', () => {
    const grade = vazio();
    grade[0][0] = grade[1][0] = 1;
    const jogo = new SudokuBinario({ tabuleiro: grade, exigirSolucaoUnica: false });
    rejeitaSemAlterar(jogo, () => jogo.preencher(2, 0, 1), /Jogada inválida/);
  });

  it('rejeita o quarto zero de uma linha', () => {
    const jogo = novoJogo();
    rejeitaSemAlterar(jogo, () => jogo.preencher(5, 1, 0), /Jogada inválida/);
  });

  it('rejeita o quarto zero de uma coluna', () => {
    const grade = vazio();
    [0, 1, 0, 1, 0, null].forEach((v, l) => { grade[l][0] = v; });
    const jogo = new SudokuBinario({ tabuleiro: grade, exigirSolucaoUnica: false });
    rejeitaSemAlterar(jogo, () => jogo.preencher(5, 0, 0), /Jogada inválida/);
  });

  for (const eixo of ['linha', 'coluna']) {
    it(`rejeita uma jogada que completa ${eixo}s repetidas`, () => {
      const grade = vazio();
      grade[0] = copiar(SOLUCAO[0]);
      grade[5] = [null, 0, 1, 0, 1, null];
      const jogo = new SudokuBinario({ tabuleiro: eixo === 'linha' ? grade : transpor(grade), exigirSolucaoUnica: false });
      jogo.preencher(eixo === 'linha' ? 5 : 0, eixo === 'linha' ? 0 : 5, 0);
      rejeitaSemAlterar(jogo, () => jogo.preencher(5, 5, 1), /Jogada inválida/);
    });
  }

  it('uma jogada localmente válida pode ser corrigida quando leva a um beco sem saída', () => {
    const jogo = novoJogo();
    jogo.preencher(0, 0, 1);
    assert.equal(avaliarTabuleiro(jogo.estado.tabuleiro).valido, true);
    assert.equal(jogo.estado.status, 'jogando');
    jogo.apagar(0, 0);
    jogo.preencher(0, 0, 0);
    assert.equal(jogo.estado.tabuleiro[0][0], 0);
  });

  it('os estados retornados não permitem alterar o tabuleiro ou as pistas internas', () => {
    const jogo = novoJogo();
    const estado = jogo.preencher(0, 0, 0);
    assert.deepEqual(estado, jogo.estado);
    estado.tabuleiro[0][2] = 0;
    estado.fixas[0][2] = false;
    estado.preenchidas = 99;
    assert.equal(jogo.estado.tabuleiro[0][2], 1);
    assert.equal(jogo.estado.fixas[0][2], true);
    assert.equal(jogo.estado.preenchidas, 13);
  });
});

describe('CT10 — Conclusão, reinício e isolamento das partidas', () => {
  it('a última casa correta conclui o desafio com 36 casas preenchidas', () => {
    const jogo = new SudokuBinario({ tabuleiro: quaseCompleto() });
    assert.equal(jogo.estado.preenchidas, 35);
    assert.equal(jogo.estado.status, 'pronto');
    jogo.preencher(0, 0, 0);
    assert.equal(jogo.estado.status, 'concluido');
    assert.equal(jogo.estado.preenchidas, 36);
    assert.equal(jogo.estado.vazias, 0);
    assert.deepEqual(jogo.estado.tabuleiro, SOLUCAO);
  });

  it('rejeita um valor errado na última casa e não anuncia conclusão', () => {
    const jogo = new SudokuBinario({ tabuleiro: quaseCompleto() });
    rejeitaSemAlterar(jogo, () => jogo.preencher(0, 0, 1), /Jogada inválida/);
    assert.equal(jogo.estado.preenchidas, 35);
    assert.notEqual(jogo.estado.status, 'concluido');
  });

  it('executa uma partida completa a partir das 12 pistas', () => {
    const jogo = novoJogo();
    concluir(jogo);
    assert.equal(jogo.estado.quantidadePistas, 12);
    assert.equal(jogo.estado.preenchidas, 36);
    assert.equal(avaliarTabuleiro(jogo.estado.tabuleiro).completo, true);
    assert.deepEqual(jogo.estado.tabuleiro, SOLUCAO);
  });

  it('bloqueia preenchimento e remoção depois da conclusão', () => {
    const jogo = new SudokuBinario({ tabuleiro: quaseCompleto() });
    jogo.preencher(0, 0, 0);
    rejeitaSemAlterar(jogo, () => jogo.preencher(0, 0, 1), /já foi concluído/);
    rejeitaSemAlterar(jogo, () => jogo.apagar(0, 0), /já foi concluído/);
  });

  for (const status of ['pronto', 'jogando', 'concluido']) {
    it(`reinicia uma partida que estava ${status}, preservando somente as pistas originais`, () => {
      const jogo = novoJogo();
      if (status === 'jogando') jogo.preencher(0, 0, 0);
      if (status === 'concluido') concluir(jogo);
      assert.equal(jogo.estado.status, status);
      const estado = jogo.reiniciar();
      assert.equal(estado.status, 'pronto');
      assert.equal(estado.preenchidas, 12);
      assert.equal(estado.vazias, 24);
      assert.equal(estado.quantidadePistas, 12);
      assert.equal(estado.fixas[0][0], false);
      assert.deepEqual(estado.tabuleiro, DESAFIO);
    });
  }

  it('reiniciar com outro desafio substitui também o conjunto de pistas', () => {
    const jogo = novoJogo();
    jogo.preencher(0, 0, 0);
    jogo.reiniciar({ tabuleiro: quaseCompleto() });
    assert.equal(jogo.estado.quantidadePistas, 35);
    assert.equal(jogo.estado.tabuleiro[0][0], null);
    assert.equal(jogo.estado.fixas[0][1], true);
    jogo.preencher(0, 0, 0);
    assert.equal(jogo.estado.status, 'concluido');
  });

  it('um reinício inválido preserva a partida e as opções anteriores', () => {
    const jogo = novoJogo();
    jogo.preencher(0, 0, 0);
    rejeitaSemAlterar(jogo, () => jogo.reiniciar({ tabuleiro: [] }), /Tabuleiro inválido/);
    rejeitaSemAlterar(jogo, () => jogo.reiniciar({ tabuleiro: semSolucao(), exigirSolucaoUnica: false }), /não possui solução/);
    rejeitaSemAlterar(jogo, () => jogo.reiniciar({ tabuleiro: vazio() }), /solução única/);
    rejeitaSemAlterar(jogo, () => jogo.reiniciar({ exigirSolucaoUnica: 'false' }), /deve ser booleano/);
  });

  it('a opção explícita de múltiplas soluções é preservada no reinício', () => {
    const jogo = new SudokuBinario({ tabuleiro: vazio(), exigirSolucaoUnica: false });
    jogo.preencher(0, 0, 0);
    jogo.reiniciar();
    assert.equal(jogo.estado.preenchidas, 0);
    assert.equal(jogo.estado.status, 'pronto');
  });

  it('partidas diferentes não compartilham tabuleiros nem progresso', () => {
    const primeira = novoJogo();
    const segunda = novoJogo();
    primeira.preencher(0, 0, 0);
    assert.equal(segunda.estado.tabuleiro[0][0], null);
    assert.equal(segunda.estado.preenchidas, 12);
    assert.equal(segunda.estado.status, 'pronto');
  });
});
