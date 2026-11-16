export const TAMANHO = 6;
export const DESAFIO_PADRAO = Object.freeze([
  [null, null, 1, null, null, null],
  [null, 1, null, null, null, null],
  [null, null, 1, null, null, 0],
  [0, null, null, 0, null, null],
  [1, null, null, null, 0, 0],
  [null, null, 0, null, 0, 0],
].map(linha => Object.freeze(linha)));

function exigir(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem);
}

export function criarTabuleiroVazio() {
  return Array.from({ length: TAMANHO }, () => Array(TAMANHO).fill(null));
}

export function coordenadaValida(linha, coluna) {
  return Number.isInteger(linha) && linha >= 0 && linha < TAMANHO
    && Number.isInteger(coluna) && coluna >= 0 && coluna < TAMANHO;
}

function validarCoordenada(linha, coluna) {
  exigir(coordenadaValida(linha, coluna), 'Coordenada inválida: use linha e coluna de 0 a 5.');
}

function relatorio(preenchidas, erros) {
  return { valido: erros.length === 0, completo: erros.length === 0 && preenchidas === 36, preenchidas, erros };
}

// null representa casa vazia. Não há conversão de strings ou booleanos.
export function avaliarTabuleiro(tabuleiro) {
  if (!Array.isArray(tabuleiro) || tabuleiro.length !== TAMANHO) {
    return relatorio(0, [{ tipo: 'FORMATO', mensagem: 'O tabuleiro deve ter 6 linhas de 6 casas.' }]);
  }
  for (let l = 0; l < TAMANHO; l += 1) {
    if (!Array.isArray(tabuleiro[l]) || tabuleiro[l].length !== TAMANHO) {
      return relatorio(0, [{ tipo: 'FORMATO', mensagem: 'O tabuleiro deve ter 6 linhas de 6 casas.' }]);
    }
  }
  const erros = [];
  let preenchidas = 0;
  for (let l = 0; l < TAMANHO; l += 1) {
    for (let c = 0; c < TAMANHO; c += 1) {
      const valor = tabuleiro[l][c];
      if (valor !== null && valor !== 0 && valor !== 1) {
        erros.push({ tipo: 'VALOR', linha: l, coluna: c, mensagem: 'Use somente os números 0, 1 ou null.' });
      } else if (valor !== null) preenchidas += 1;
    }
  }
  if (erros.length > 0) return relatorio(preenchidas, erros);

  for (const eixo of ['linha', 'coluna']) {
    const sequencias = eixo === 'linha' ? tabuleiro
      : Array.from({ length: TAMANHO }, (_, c) => tabuleiro.map(linha => linha[c]));
    const completas = new Map();
    sequencias.forEach((sequencia, indice) => {
      for (const valor of [0, 1]) {
        if (sequencia.filter(v => v === valor).length > 3) {
          erros.push({ tipo: 'EXCESSO', eixo, indice, valor, mensagem: `Mais de três valores ${valor} na ${eixo} ${indice + 1}.` });
        }
      }
      for (let inicio = 0; inicio <= 3; inicio += 1) {
        const valor = sequencia[inicio];
        if (valor !== null && valor === sequencia[inicio + 1] && valor === sequencia[inicio + 2]) {
          erros.push({ tipo: 'TRINCA', eixo, indice, inicio, valor, mensagem: `Três valores iguais consecutivos na ${eixo} ${indice + 1}.` });
        }
      }
      if (!sequencia.includes(null)) {
        const chave = sequencia.join('');
        if (completas.has(chave)) {
          erros.push({ tipo: 'REPETICAO', eixo, indices: [completas.get(chave), indice], mensagem: `Há ${eixo}s completas repetidas.` });
        } else completas.set(chave, indice);
      }
    });
  }
  return relatorio(preenchidas, erros);
}

function candidatosInternos(tabuleiro, linha, coluna) {
  const candidatos = [];
  for (const valor of [0, 1]) {
    tabuleiro[linha][coluna] = valor;
    if (avaliarTabuleiro(tabuleiro).valido) candidatos.push(valor);
  }
  tabuleiro[linha][coluna] = null;
  return candidatos;
}

// Candidatos respeitam as restrições imediatas; não antecipam toda a solução.
export function listarCandidatos(tabuleiro, linha, coluna) {
  validarCoordenada(linha, coluna);
  exigir(avaliarTabuleiro(tabuleiro).valido, 'Tabuleiro inválido.');
  if (tabuleiro[linha][coluna] !== null) return [];
  return candidatosInternos(structuredClone(tabuleiro), linha, coluna);
}

// Para ao encontrar limite soluções. Com limite=2, distingue 0, 1 e pelo menos 2.
export function contarSolucoes(tabuleiro, limite = 2) {
  exigir(limite === 1 || limite === 2, 'O limite de busca deve ser 1 ou 2.');
  exigir(avaliarTabuleiro(tabuleiro).valido, 'Tabuleiro inválido.');
  const grade = structuredClone(tabuleiro);
  let quantidade = 0;
  let primeiraSolucao = null;

  function buscar() {
    if (quantidade >= limite) return;
    let melhor = null;
    for (let l = 0; l < TAMANHO; l += 1) {
      for (let c = 0; c < TAMANHO; c += 1) {
        if (grade[l][c] !== null) continue;
        const candidatos = candidatosInternos(grade, l, c);
        if (candidatos.length === 0) return;
        if (melhor === null || candidatos.length < melhor.candidatos.length) {
          melhor = { linha: l, coluna: c, candidatos };
        }
      }
    }
    if (melhor === null) {
      quantidade += 1;
      primeiraSolucao ??= structuredClone(grade);
      return;
    }
    for (const valor of melhor.candidatos) {
      grade[melhor.linha][melhor.coluna] = valor;
      buscar();
      grade[melhor.linha][melhor.coluna] = null;
      if (quantidade >= limite) return;
    }
  }
  buscar();
  return { quantidade, limiteAtingido: quantidade === limite, primeiraSolucao };
}

export class SudokuBinario {
  #inicial;
  #tabuleiro;
  #fixas;
  #status;
  #exigirSolucaoUnica = true;

  constructor(opcoes = {}) {
    this.reiniciar(opcoes);
  }

  get estado() {
    const preenchidas = this.#tabuleiro.flat().filter(v => v !== null).length;
    return structuredClone({
      tamanho: TAMANHO, totalCasas: 36, status: this.#status,
      preenchidas, vazias: 36 - preenchidas,
      quantidadePistas: this.#fixas.flat().filter(Boolean).length,
      tabuleiro: this.#tabuleiro, fixas: this.#fixas,
    });
  }

  reiniciar({
    tabuleiro = this.#inicial ?? DESAFIO_PADRAO,
    exigirSolucaoUnica = this.#exigirSolucaoUnica,
  } = {}) {
    exigir(typeof exigirSolucaoUnica === 'boolean', 'exigirSolucaoUnica deve ser booleano.');
    const avaliacao = avaliarTabuleiro(tabuleiro);
    exigir(avaliacao.valido, 'Tabuleiro inválido.');
    const busca = contarSolucoes(tabuleiro, exigirSolucaoUnica ? 2 : 1);
    exigir(busca.quantidade > 0, 'O desafio não possui solução.');
    exigir(!exigirSolucaoUnica || busca.quantidade === 1, 'O desafio deve possuir solução única.');
    // A partida anterior só é substituída depois de validar o novo desafio.
    this.#inicial = structuredClone(tabuleiro);
    this.#tabuleiro = structuredClone(tabuleiro);
    this.#fixas = tabuleiro.map(linha => linha.map(valor => valor !== null));
    this.#exigirSolucaoUnica = exigirSolucaoUnica;
    this.#status = avaliacao.completo ? 'concluido' : 'pronto';
    return this.estado;
  }

  #validarEdicao(linha, coluna) {
    validarCoordenada(linha, coluna);
    exigir(this.#status !== 'concluido', 'O desafio já foi concluído. Reinicie para jogar novamente.');
    exigir(!this.#fixas[linha][coluna], 'Uma pista fixa não pode ser alterada.');
  }

  preencher(linha, coluna, valor) {
    this.#validarEdicao(linha, coluna);
    exigir(valor === 0 || valor === 1, 'Use somente os números 0 ou 1.');
    if (this.#tabuleiro[linha][coluna] === valor) return this.estado;
    const tentativa = structuredClone(this.#tabuleiro);
    tentativa[linha][coluna] = valor;
    const avaliacao = avaliarTabuleiro(tentativa);
    exigir(avaliacao.valido, `Jogada inválida: ${avaliacao.erros.map(e => e.mensagem).join(' ')}`);
    this.#tabuleiro = tentativa;
    this.#status = avaliacao.completo ? 'concluido' : 'jogando';
    return this.estado;
  }

  apagar(linha, coluna) {
    this.#validarEdicao(linha, coluna);
    if (this.#tabuleiro[linha][coluna] === null) return this.estado;
    this.#tabuleiro[linha][coluna] = null;
    this.#status = 'jogando';
    return this.estado;
  }
}
