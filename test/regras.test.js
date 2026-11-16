import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  criarTabuleiroVazio, coordenadaValida, avaliarTabuleiro, listarCandidatos, contarSolucoes,
} from '../src/sudoku.js';
import { SOLUCAO, DESAFIO, copiar, transpor, vazio, semSolucao } from '../support/fixtures.js';

const temErro = (resultado, tipo, eixo) => resultado.erros.some(e => e.tipo === tipo && (!eixo || e.eixo === eixo));

describe('CT01 — Formato 6 por 6 e valores permitidos', () => {
  it('cria 36 casas vazias em seis linhas independentes', () => {
    const grade = criarTabuleiroVazio();
    assert.equal(grade.length, 6);
    assert.ok(grade.every(linha => linha.length === 6));
    assert.deepEqual(grade.flat(), Array(36).fill(null));
    grade[0][0] = 0;
    assert.equal(grade[1][0], null);
    assert.deepEqual(criarTabuleiroVazio(), vazio());
  });

  it('um tabuleiro vazio é válido, mas ainda não está completo', () => {
    assert.deepEqual(avaliarTabuleiro(vazio()), { valido: true, completo: false, preenchidas: 0, erros: [] });
  });

  it('reconhece uma solução completa com 36 números', () => {
    assert.deepEqual(avaliarTabuleiro(SOLUCAO), { valido: true, completo: true, preenchidas: 36, erros: [] });
  });

  for (const [nome, grade] of [
    ['null', null], ['objeto', {}], ['texto', '000111'], ['sem linhas', []],
    ['cinco linhas', vazio().slice(1)], ['sete linhas', [...vazio(), Array(6).fill(null)]],
    ['cinco colunas', vazio().map(l => l.slice(1))], ['sete colunas', vazio().map(l => [...l, null])],
    ['linha que não é lista', [null, ...vazio().slice(1)]],
  ]) {
    it(`rejeita formato inválido: ${nome}`, () => {
      const resultado = avaliarTabuleiro(grade);
      assert.equal(resultado.valido, false);
      assert.equal(resultado.completo, false);
      assert.ok(temErro(resultado, 'FORMATO'));
    });
  }

  for (const [nome, valor] of [
    ['dois', 2], ['negativo', -1], ['fracionário', 0.5], ['zero em texto', '0'],
    ['um em texto', '1'], ['true', true], ['false', false], ['undefined', undefined],
    ['NaN', NaN], ['infinito', Infinity], ['objeto', {}],
  ]) {
    it(`rejeita valor ${nome} sem converter tipos`, () => {
      const grade = vazio();
      grade[0][0] = valor;
      const resultado = avaliarTabuleiro(grade);
      assert.equal(resultado.valido, false);
      assert.equal(resultado.completo, false);
      assert.ok(temErro(resultado, 'VALOR'));
    });
  }

  it('rejeita linhas ou casas ausentes em arrays esparsos', () => {
    const semLinha = vazio();
    delete semLinha[2];
    assert.ok(temErro(avaliarTabuleiro(semLinha), 'FORMATO'));
    const semCasa = vazio();
    delete semCasa[2][3];
    assert.ok(temErro(avaliarTabuleiro(semCasa), 'VALOR'));
  });

  it('a avaliação não modifica a matriz recebida', () => {
    const grade = copiar(DESAFIO);
    const antes = copiar(grade);
    avaliarTabuleiro(grade);
    assert.deepEqual(grade, antes);
  });
});

describe('CT02 — Três zeros e três uns por linha e coluna', () => {
  for (const eixo of ['linha', 'coluna']) {
    for (const valor of [0, 1]) {
      it(`rejeita quatro valores ${valor} na mesma ${eixo}, mesmo sem trinca`, () => {
        const grade = vazio();
        grade[0] = [valor, valor, 1 - valor, valor, valor, null];
        const resultado = avaliarTabuleiro(eixo === 'linha' ? grade : transpor(grade));
        assert.equal(resultado.valido, false);
        assert.ok(temErro(resultado, 'EXCESSO', eixo));
        assert.equal(temErro(resultado, 'TRINCA', eixo), false);
      });

      it(`aceita três valores ${valor} numa ${eixo} incompleta`, () => {
        const grade = vazio();
        grade[0] = [valor, 1 - valor, valor, 1 - valor, valor, null];
        const resultado = avaliarTabuleiro(eixo === 'linha' ? grade : transpor(grade));
        assert.equal(resultado.valido, true);
        assert.equal(resultado.completo, false);
      });
    }
  }

  it('todas as seis linhas e seis colunas da solução têm três de cada símbolo', () => {
    for (const linha of [...SOLUCAO, ...transpor(SOLUCAO)]) {
      assert.equal(linha.filter(v => v === 0).length, 3);
      assert.equal(linha.filter(v => v === 1).length, 3);
    }
  });
});

describe('CT03 — Proibição de três valores iguais consecutivos', () => {
  for (const eixo of ['linha', 'coluna']) {
    for (const valor of [0, 1]) {
      for (let inicio = 0; inicio <= 3; inicio += 1) {
        it(`detecta trinca ${valor}${valor}${valor} na ${eixo}, começando na posição ${inicio}`, () => {
          const grade = vazio();
          grade[0].splice(inicio, 3, valor, valor, valor);
          const resultado = avaliarTabuleiro(eixo === 'linha' ? grade : transpor(grade));
          assert.equal(resultado.valido, false);
          assert.ok(temErro(resultado, 'TRINCA', eixo));
        });
      }
    }
  }

  for (const valor of [0, 1]) {
    it(`aceita um par de valores ${valor}`, () => {
      const grade = vazio();
      grade[0] = [valor, valor, null, null, null, null];
      assert.equal(avaliarTabuleiro(grade).valido, true);
    });

    it(`uma casa vazia interrompe uma possível sequência de valores ${valor}`, () => {
      const grade = vazio();
      grade[0] = [valor, null, valor, null, null, null];
      assert.equal(avaliarTabuleiro(grade).valido, true);
    });
  }

  it('a regra não é circular entre o final e o início de uma linha', () => {
    const grade = vazio();
    grade[0] = [0, 1, null, null, 0, 0];
    assert.equal(avaliarTabuleiro(grade).valido, true);
  });

  it('trincas nas diagonais são permitidas', () => {
    assert.deepEqual([3, 4, 5].map(i => SOLUCAO[i][i]), [0, 0, 0]);
    assert.equal(avaliarTabuleiro(SOLUCAO).valido, true);
  });
});

describe('CT04 — Unicidade de linhas e colunas completas', () => {
  for (const eixo of ['linha', 'coluna']) {
    it(`rejeita ${eixo}s completas iguais, inclusive não adjacentes`, () => {
      const grade = vazio();
      grade[0] = copiar(SOLUCAO[0]);
      grade[5] = copiar(SOLUCAO[0]);
      const resultado = avaliarTabuleiro(eixo === 'linha' ? grade : transpor(grade));
      assert.equal(resultado.valido, false);
      const erro = resultado.erros.find(e => e.tipo === 'REPETICAO' && e.eixo === eixo);
      assert.deepEqual(erro.indices, [0, 5]);
    });

    it(`permite ${eixo}s parciais iguais enquanto contêm casas vazias`, () => {
      const grade = vazio();
      grade[0] = [0, 1, null, null, null, null];
      grade[5] = [0, 1, null, null, null, null];
      assert.equal(avaliarTabuleiro(eixo === 'linha' ? grade : transpor(grade)).valido, true);
    });
  }

  it('uma linha pode ter a mesma sequência que uma coluna', () => {
    assert.deepEqual(SOLUCAO[0], transpor(SOLUCAO)[0]);
    assert.equal(avaliarTabuleiro(SOLUCAO).valido, true);
  });

  it('um tabuleiro cheio com repetições não é considerado completo e correto', () => {
    const grade = Array.from({ length: 6 }, (_, i) => copiar(i % 2 === 0 ? SOLUCAO[0] : SOLUCAO[0].map(v => 1 - v)));
    const resultado = avaliarTabuleiro(grade);
    assert.equal(resultado.preenchidas, 36);
    assert.equal(resultado.valido, false);
    assert.equal(resultado.completo, false);
    assert.ok(temErro(resultado, 'REPETICAO', 'linha'));
    assert.ok(temErro(resultado, 'REPETICAO', 'coluna'));
  });
});

describe('CT05 — Coordenadas de zero a cinco', () => {
  for (const [linha, coluna] of [[0, 0], [0, 5], [5, 0], [5, 5]]) {
    it(`aceita o canto (${linha}, ${coluna})`, () => {
      assert.equal(coordenadaValida(linha, coluna), true);
      assert.deepEqual(listarCandidatos(vazio(), linha, coluna), [0, 1]);
    });
  }

  for (const [nome, linha, coluna] of [
    ['linha negativa', -1, 0], ['linha seis', 6, 0], ['coluna negativa', 0, -1],
    ['coluna seis', 0, 6], ['linha fracionária', 0.5, 0], ['coluna fracionária', 0, 0.5],
    ['texto', '0', 0], ['null', 0, null], ['NaN', NaN, 0], ['infinito', Infinity, 0],
  ]) {
    it(`rejeita ${nome}`, () => {
      assert.equal(coordenadaValida(linha, coluna), false);
      assert.throws(() => listarCandidatos(vazio(), linha, coluna), /Coordenada inválida/);
    });
  }
});

describe('CT06 — Candidatos das casas vazias', () => {
  for (const eixo of ['linha', 'coluna']) {
    for (const valor of [0, 1]) {
      it(`um par ${valor}${valor} na ${eixo} força o símbolo oposto ao lado`, () => {
        const grade = vazio();
        grade[0] = [valor, valor, null, null, null, null];
        const entrada = eixo === 'linha' ? grade : transpor(grade);
        assert.deepEqual(listarCandidatos(entrada, eixo === 'linha' ? 0 : 2, eixo === 'linha' ? 2 : 0), [1 - valor]);
      });

      it(`o intervalo ${valor}_ ${valor} na ${eixo} exige o símbolo oposto no meio`, () => {
        const grade = vazio();
        grade[0] = [valor, null, valor, null, null, null];
        const entrada = eixo === 'linha' ? grade : transpor(grade);
        assert.deepEqual(listarCandidatos(entrada, eixo === 'linha' ? 0 : 1, eixo === 'linha' ? 1 : 0), [1 - valor]);
      });

      it(`três valores ${valor} na ${eixo} obrigam o outro símbolo na última casa`, () => {
        const grade = vazio();
        grade[0] = [valor, 1 - valor, valor, 1 - valor, valor, null];
        const entrada = eixo === 'linha' ? grade : transpor(grade);
        assert.deepEqual(listarCandidatos(entrada, eixo === 'linha' ? 0 : 5, eixo === 'linha' ? 5 : 0), [1 - valor]);
      });
    }
  }

  it('casas preenchidas, inclusive com zero, não recebem candidatos', () => {
    assert.deepEqual(listarCandidatos(DESAFIO, 2, 5), []);
    assert.deepEqual(listarCandidatos(DESAFIO, 0, 2), []);
  });

  it('retorna lista vazia quando linha e coluna exigem valores incompatíveis', () => {
    const grade = vazio();
    grade[0][1] = grade[0][2] = 0;
    grade[1][0] = grade[2][0] = 1;
    assert.equal(avaliarTabuleiro(grade).valido, true);
    assert.deepEqual(listarCandidatos(grade, 0, 0), []);
  });

  it('candidatos locais não consultam a resposta final do desafio', () => {
    assert.deepEqual(listarCandidatos(DESAFIO, 0, 0), [0, 1]);
  });

  it('a consulta não altera a matriz recebida', () => {
    const grade = copiar(DESAFIO);
    const antes = copiar(grade);
    listarCandidatos(grade, 0, 0);
    assert.deepEqual(grade, antes);
  });

  it('rejeita uma matriz que já viola as regras', () => {
    const grade = vazio();
    grade[0] = [0, 0, 0, null, null, null];
    assert.throws(() => listarCandidatos(grade, 0, 5), /Tabuleiro inválido/);
  });
});

describe('CT07 — Solucionador, existência e solução única', () => {
  it('encontra exatamente a solução esperada para o desafio de 12 pistas', () => {
    const resultado = contarSolucoes(DESAFIO);
    assert.equal(resultado.quantidade, 1);
    assert.equal(resultado.limiteAtingido, false);
    assert.deepEqual(resultado.primeiraSolucao, SOLUCAO);
  });

  it('preserva todas as pistas, incluindo zeros', () => {
    const resultado = contarSolucoes(DESAFIO);
    for (let l = 0; l < 6; l += 1) for (let c = 0; c < 6; c += 1) {
      if (DESAFIO[l][c] !== null) assert.equal(resultado.primeiraSolucao[l][c], DESAFIO[l][c]);
    }
    assert.equal(avaliarTabuleiro(resultado.primeiraSolucao).completo, true);
  });

  it('uma solução já completa tem exatamente uma solução', () => {
    assert.deepEqual(contarSolucoes(SOLUCAO), { quantidade: 1, limiteAtingido: false, primeiraSolucao: SOLUCAO });
  });

  it('detecta ausência de solução mesmo quando não há violações locais', () => {
    const grade = semSolucao();
    assert.equal(avaliarTabuleiro(grade).valido, true);
    assert.deepEqual(contarSolucoes(grade), { quantidade: 0, limiteAtingido: false, primeiraSolucao: null });
  });

  it('um tabuleiro vazio possui pelo menos duas soluções e interrompe no limite', () => {
    const resultado = contarSolucoes(vazio());
    assert.equal(resultado.quantidade, 2);
    assert.equal(resultado.limiteAtingido, true);
    assert.equal(avaliarTabuleiro(resultado.primeiraSolucao).completo, true);
  });

  it('limite um encontra uma resposta sem afirmar unicidade', () => {
    const resultado = contarSolucoes(vazio(), 1);
    assert.equal(resultado.quantidade, 1);
    assert.equal(resultado.limiteAtingido, true);
  });

  for (const limite of [0, -1, 3, 1.5, '2', null]) {
    it(`rejeita limite inválido ${JSON.stringify(limite)}`, () => {
      assert.throws(() => contarSolucoes(DESAFIO, limite), /limite de busca/);
    });
  }

  it('rejeita tabuleiro com violações imediatas', () => {
    const grade = vazio();
    grade[0] = [1, 1, 1, null, null, null];
    assert.throws(() => contarSolucoes(grade), /Tabuleiro inválido/);
  });

  it('a busca não altera a entrada, e a resposta retornada é independente', () => {
    const grade = copiar(DESAFIO);
    const antes = copiar(grade);
    const resultado = contarSolucoes(grade);
    assert.deepEqual(grade, antes);
    resultado.primeiraSolucao[0][2] = 0;
    assert.deepEqual(grade, antes);
  });
});
