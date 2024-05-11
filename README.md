# exportador-filmow

![banner](./images/banner.png)

Exporta suas listas de filmes do Filmow em um .csv compatível com a ferramenta de importação do Letterboxd.

## Como usar

- Baixar [aqui](/dist/) e rodar o executável de acordo com o seu sistema operacional.

- Seguir as instruções do prompt.

- Importar o csv gerado no Letterboxd acessando a ferramenta de importação [neste link](https://letterboxd.com/import/).

- Já que você está aqui aproveita e [me segue no Letterboxd](https://letterboxd.com/edemarinho/).

## Alguns detalhes

Essa ferramenta foi desenvolvida com o Node.js versão 21.7.3

### Modos de operação

Existem duas formas de exportar seus dados com essa ferramenta: informando o seu user ou autenticando no Filmow.

A única diferença é que autenticando no Filmow, o scraper vai conseguir as datas em que os filmes foram marcados como assistidos na sua conta. Caso você escolha essa opção uma janela vai ser aberta na tela de login do site e o scraper vai usar a sessão para obter essa informação específica.

**Cabe esclarecer que o script não salva as informações de senha ou sessão e nem os utiliza pra mais nada.**

### Títulos errados

Em alguns casos a lista foi gerada com alguns títulos errados. 
Isso acontece porque eu forçei o scraper a capturar o título marcado como "Estados Unidos da América" dentro de um dropdown chamado "Outros títulos" na página do filme no Filmow.

Essa escolha se deu porque a ferramenta do Letterboxd não reconhece alguns títulos que estão em caracteres não-ocidentais. O problema é que a base do Filmow é meio imprevisível e nem todos estão salvos com o título correto em inglês, como no exemplo abaixo:

![wrong-title](./images/wrong-title.png)

No futuro eu vou aprimorar a captura dos títulos mas a ferramenta de importação do Letterboxd possibilita revisar os filmes e corrigir os que estiverem errados.

### PKG

Pra criar os executáveis eu usei o [vercel/pkg](https://github.com/vercel/pkg), um projeto que foi arquivado por conta de uma vulnerabilidade conforme explicado [aqui](https://github.com/vercel/pkg/security/advisories/GHSA-22r3-9w55-cj54).

Eu consegui utilizar o [suporte nativo do node para criação de executáveis](https://nodejs.org/api/single-executable-applications.html) mas no fim achei muito complexo. Também experimentei o [Nexe](https://github.com/nexe/nexe/releases) mas por alguma razão o executável pra Windows não funcionou.

Como eu não identifiquei problemas com os executáveis optei por manter o PKG até eu descolar uma alternativa mais simples.
