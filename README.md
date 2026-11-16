# Desafio — Sudoku binário 6 × 6

Implementação de Sudoku binário com **6 linhas, 6 colunas e 36 casas**, acompanhada de **158 testes automatizados em JavaScript**.

## 1. Concepção do desafio

O desafio consiste em transformar as regras do Sudoku binário em comportamentos verificáveis. O jogador deve completar um tabuleiro com os números **0 e 1**, respeitando equilíbrio, sequências e unicidade das linhas e colunas.

O projeto reúne um motor de partida, um verificador de regras, um solucionador e uma demonstração no terminal. Os testes são escritos em JavaScript e executam diretamente o código JavaScript de `src/sudoku.js`.

| Requisito | Como foi atendido |
| --- | --- |
| Explicar a concepção no leia-me | Seção 1 deste README |
| Explicar o funcionamento dos casos de teste | Seções 4 e 5 deste README |
| Tabuleiro de tamanho 6 × 6 | Configuração fixa de 36 casas |
| Testes em JavaScript para testar JavaScript | `node:test` e `node:assert/strict` nos arquivos `test/*.test.js` |

## 2. Regras adotadas

1. Cada casa preenchida contém o número `0` ou `1`.
2. Cada linha e cada coluna completa possui **três zeros e três uns**.
3. Não pode haver **três valores iguais consecutivos**, na horizontal ou vertical.
4. Duas linhas completas não podem ser iguais; o mesmo vale para duas colunas completas.
5. As pistas iniciais são fixas, incluindo as pistas com valor zero.

A referência para as regras de equilíbrio, sequência e unicidade é o [BinaryPuzzle.com](https://www.binarypuzzle.com/rules.php). Uma linha pode ter a mesma sequência de uma coluna; a comparação ocorre dentro de cada orientação.

### Convenções da implementação

| Situação | Comportamento definido |
| --- | --- |
| Coordenadas | `(linha, coluna)`, começando em zero e terminando em cinco |
| Casa vazia | `null`; zero é um valor preenchido |
| Valores em texto ou booleanos | Rejeitados, sem conversão automática |
| Tabuleiro parcial | Pode ter menos de três de cada valor, nunca mais de três |
| Linhas ou colunas parciais iguais | Permitidas enquanto ainda contêm casas vazias |
| Sequências nas diagonais | Permitidas; a restrição de trincas usa linhas e colunas |
| Alterar ou apagar pista fixa | Erro; a partida permanece igual |
| Alterar valor colocado pelo jogador | Permitido quando a nova jogada respeita as regras locais |
| Repetir um valor editável já colocado | Operação sem efeito |
| Apagar casa já vazia | Operação sem efeito |
| Completar corretamente as 36 casas | Estado `concluido` |
| Jogar depois da conclusão | Bloqueado; é necessário reiniciar |
| Reinício inválido | Erro; preserva o tabuleiro, as pistas e as opções anteriores |

O desafio padrão tem **12 pistas**, **24 casas editáveis** e **uma única solução**. A criação de uma partida verifica a existência de solução e exige unicidade por padrão. Para explorar outros tabuleiros, `exigirSolucaoUnica: false` permite desafios com múltiplas soluções, mantendo a exigência de pelo menos uma solução.

### Validação local e busca de soluções

`avaliarTabuleiro` verifica as regras visíveis do tabuleiro atual. Um tabuleiro parcial pode respeitar essas regras e ainda não ter uma conclusão possível. `contarSolucoes` faz a busca completa necessária para distinguir essas situações.

As jogadas são verificadas pelas restrições locais. O motor permite que o jogador explore uma escolha e depois a corrija; não consulta a resposta final para julgar cada jogada. A suíte inclui um caso localmente válido que leva a um beco sem saída, seguido de sua correção.

O solucionador usa busca com retrocesso e prioriza casas com menos candidatos. Ele demonstra existência e unicidade; não promete resolver o desafio exclusivamente por deduções apresentadas ao jogador.

## 3. Como executar

Requisito: **Node.js 22 ou superior**. Todos os recursos usados são nativos; não há pacotes para instalar.

Na raiz do projeto:

```sh
node --test
```

O atalho equivalente, quando o npm estiver disponível, é:

```sh
npm test
```

Resultado esperado:

```text
tests 158
suites 10
pass 158
fail 0
skipped 0
todo 0
```

Outros comandos:

```sh
# Demonstração de validação, solução, partida completa e reinício
node exemplo.js

# Reexecutar ao salvar os arquivos
node --test --watch

# Executar somente os testes de trincas
node --test --test-name-pattern="CT03"

# Cobertura com a opção experimental do Node.js
node --test --experimental-test-coverage
```

Os atalhos npm correspondentes são `npm run demo`, `npm run test:watch` e `npm run test:coverage`. As opções do executor estão na [documentação do Node.js](https://nodejs.org/api/test.html).

## 4. Como os testes funcionam

Cada `describe` representa um grupo de regras. Cada `it` executa um caso de teste. Tabelas geram casos separados para valores, orientações, posições e entradas inválidas; o total de 158 inclui essas combinações.

Os testes seguem três etapas:

1. **Preparar:** montar uma matriz conhecida ou uma partida nova.
2. **Agir:** avaliar o tabuleiro, consultar candidatos, preencher, apagar ou reiniciar.
3. **Verificar:** comparar o resultado com o esperado usando `assert`.

Exemplo de teste para uma trinca horizontal:

```js
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { criarTabuleiroVazio, avaliarTabuleiro } from './src/sudoku.js';

it('rejeita três zeros consecutivos numa linha', () => {
  const tabuleiro = criarTabuleiroVazio();
  tabuleiro[0] = [0, 0, 0, null, null, null];

  const resultado = avaliarTabuleiro(tabuleiro);

  assert.equal(resultado.valido, false);
  assert.ok(resultado.erros.some(erro => erro.tipo === 'TRINCA'));
});
```

O exemplo explica a estrutura. A suíte já inclui as duas trincas possíveis, nas duas orientações e nas quatro posições de início.

### Repetibilidade e isolamento

- `support/fixtures.js` define o desafio, a resposta esperada e os cenários de teste.
- A resposta esperada é uma matriz fixa; os testes não a calculam chamando o próprio solucionador.
- Cada teste de partida cria sua própria instância, sem compartilhar progresso.
- Os testes de rejeição verificam o erro e confirmam que a partida permanece igual.
- A suíte cobre matrizes inválidas, tabuleiros incompletos e completos, ausência de solução e múltiplas soluções.
- As sequências de integração completam partidas reais e verificam seu reinício.

Uma asserção que falha faz o comando retornar código diferente de zero e reprova a execução no GitHub Actions.

## 5. Catálogo dos casos de teste

| Grupo | Casos | Cobertura | Arquivo |
| --- | ---: | --- | --- |
| CT01 | 25 | Dimensões 6 × 6, valores, matrizes esparsas e preservação da entrada | [regras.test.js](test/regras.test.js) |
| CT02 | 9 | Limite de três zeros e três uns por linha e coluna | [regras.test.js](test/regras.test.js) |
| CT03 | 22 | Trincas de 0 e 1, duas orientações, quatro inícios, pares e diagonais | [regras.test.js](test/regras.test.js) |
| CT04 | 6 | Repetição de linhas e colunas completas e permissão de linhas parciais iguais | [regras.test.js](test/regras.test.js) |
| CT05 | 14 | Quatro cantos e coordenadas inválidas | [regras.test.js](test/regras.test.js) |
| CT06 | 17 | Candidatos por pares, intervalos, equilíbrio e conflitos entre orientações | [regras.test.js](test/regras.test.js) |
| CT07 | 14 | Solução única, ausência de solução, múltiplas respostas e limites da busca | [regras.test.js](test/regras.test.js) |
| CT08 | 13 | Criação da partida, pistas fixas, unicidade e opções | [partida.test.js](test/partida.test.js) |
| CT09 | 27 | Preenchimento, correção, remoção e rejeição de jogadas inválidas | [partida.test.js](test/partida.test.js) |
| CT10 | 11 | Conclusão, partida completa, reinício e isolamento | [partida.test.js](test/partida.test.js) |
| **Total** | **158** | **10 grupos de testes** | |

### Exemplos de entrada e resultado esperado

| Entrada ou ação | Resultado esperado |
| --- | --- |
| Criar o desafio padrão | 36 casas, 12 pistas e 24 vazias |
| Linha `[0, 0, 0, null, null, null]` | Erro `TRINCA` |
| Linha `[0, 0, 1, 0, 0, null]` | Erro `EXCESSO`, mesmo sem trinca |
| Duas linhas completas iguais | Erro `REPETICAO` |
| Duas linhas incompletas iguais | Permitidas, se não houver outras violações |
| Valor `'0'`, `true` ou `2` | Erro de valor |
| Consultar candidatos no intervalo `0 _ 0` | Apenas `1` |
| Apagar uma pista inicial igual a zero | Erro; pista preservada |
| Preencher a última casa corretamente | 36 preenchidas e estado `concluido` |
| Reiniciar | Restaura somente as pistas iniciais |

## 6. Organização do projeto

```text
sudoku-binario/
├── .github/workflows/testes.yml
├── .gitignore
├── README.md
├── VALIDACAO.md
├── exemplo.js
├── package.json
├── src/
│   └── sudoku.js
├── support/
│   └── fixtures.js
└── test/
    ├── regras.test.js
    └── partida.test.js
```

## 7. API da implementação

| Exportação de `src/sudoku.js` | Finalidade |
| --- | --- |
| `TAMANHO` | Valor fixo `6` |
| `DESAFIO_PADRAO` | Matriz imutável com 12 pistas |
| `criarTabuleiroVazio()` | Nova matriz 6 × 6 preenchida com `null` |
| `coordenadaValida(linha, coluna)` | Retorna `true` ou `false` |
| `avaliarTabuleiro(tabuleiro)` | Retorna `{ valido, completo, preenchidas, erros }` |
| `listarCandidatos(tabuleiro, linha, coluna)` | Valores localmente permitidos numa casa vazia |
| `contarSolucoes(tabuleiro, limite = 2)` | Busca respostas e retorna a primeira encontrada |
| `new SudokuBinario(opcoes)` | Cria uma partida; aceita `tabuleiro` e `exigirSolucaoUnica` |

O verificador retorna erros dos tipos `FORMATO`, `VALOR`, `EXCESSO`, `TRINCA` e `REPETICAO`. Campos de localização usam índices começando em zero. `completo` só é verdadeiro quando as 36 casas estão preenchidas e todas as regras são respeitadas.

`listarCandidatos` devolve `[]` para uma casa já preenchida ou para uma casa sem alternativa localmente permitida. A função rejeita matrizes que já violam as regras.

### Retorno do solucionador

```js
{
  quantidade: 1,
  limiteAtingido: false,
  primeiraSolucao: [/* matriz 6 × 6 */]
}
```

O limite pode ser `1` ou `2`. Com o limite padrão:

- `quantidade: 0` significa ausência de solução; `primeiraSolucao` é `null`.
- `quantidade: 1` e `limiteAtingido: false` confirmam solução única.
- `quantidade: 2` e `limiteAtingido: true` significam **pelo menos duas soluções**, pois a busca é interrompida.

Com limite `1`, encontrar uma resposta não prova unicidade. A busca não modifica a matriz recebida.

### Métodos da partida

| Recurso | Comportamento |
| --- | --- |
| `jogo.estado` | Cópia do tabuleiro, das pistas fixas, do progresso e do status |
| `jogo.preencher(linha, coluna, valor)` | Insere ou substitui um valor editável |
| `jogo.apagar(linha, coluna)` | Remove um valor colocado pelo jogador |
| `jogo.reiniciar(opcoes = {})` | Restaura o desafio atual ou valida e carrega outro |

Os estados possíveis são `pronto`, `jogando` e `concluido`. Os métodos que alteram a partida retornam uma cópia do estado atualizado. Ações inválidas geram `Error` e não modificam a partida.

## 8. Repositório e integração contínua

Repositório: [LuizEdVS/desafio_teste_sudoku](https://github.com/LuizEdVS/desafio_teste_sudoku).

```sh
git clone https://github.com/LuizEdVS/desafio_teste_sudoku.git
cd desafio_teste_sudoku
node --test
```

O workflow `.github/workflows/testes.yml` executa os testes e a demonstração em **Node.js 22 e 24** a cada push e pull request. Os resultados ficam na aba [Actions](https://github.com/LuizEdVS/desafio_teste_sudoku/actions).
