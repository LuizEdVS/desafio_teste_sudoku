# Validação local

Verificação realizada em 16/11/2026, no Windows, com Node.js `v24.22.1`.

Comando executado na raiz do projeto:

```sh
node --test
```

Resultado:

```text
tests 158
suites 10
pass 158
fail 0
cancelled 0
skipped 0
todo 0
```

A suíte verifica o tabuleiro 6 × 6, os valores 0 e 1, equilíbrio nas duas orientações, proibição de trincas, linhas e colunas completas distintas, pistas fixas, candidatos, solução única, cenários sem solução e com múltiplas respostas, partida completa e reinício.

Também foi executado `node exemplo.js`, demonstrando rejeição de uma jogada inválida, confirmação de solução única, preenchimento das 36 casas e restauração das 12 pistas após reinício.

O workflow executa os testes em Node.js 22 e 24. Os resultados da integração contínua ficam na aba [Actions do repositório](https://github.com/LuizEdVS/desafio_teste_sudoku/actions).
