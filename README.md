# NS ALOC · Torre Previsto x Realizado V2

Projeto preparado para publicação no GitHub/GitHub Pages.

## Estrutura

```
ns-aloc-github/
├── index.html
├── css/
│   └── style.css
└── js/
    └── app.js
```

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos desta pasta para a branch principal, normalmente `main`.
3. No GitHub, acesse **Settings > Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**.
5. Escolha a branch `main` e a pasta `/root`.
6. Salve e aguarde a URL pública ser gerada.

## Observações

- As bibliotecas externas continuam sendo carregadas por CDN: Firebase, SheetJS e Lucide Icons.
- O arquivo original único foi separado em HTML, CSS e JavaScript para facilitar manutenção, versionamento e publicação.
- Antes de publicar, revise as credenciais/configurações do Firebase no arquivo `js/app.js`.
