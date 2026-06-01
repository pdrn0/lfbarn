# LF Barn – American Lifestyle

## Stack
- Node.js + Express (backend)
- PostgreSQL (banco de dados)
- HTML/CSS/JS puro (frontend)

## Deploy no Railway

### 1. Criar projeto no Railway
- Acesse railway.app → New Project
- Deploy from GitHub (suba este repositório)

### 2. Adicionar PostgreSQL
- No projeto → Add Service → Database → PostgreSQL
- O Railway injeta automaticamente a variável `DATABASE_URL`

### 3. Variáveis de ambiente
No serviço principal, adicione:
```
JWT_SECRET=coloque_uma_chave_secreta_aqui
```
(DATABASE_URL já é injetada automaticamente pelo Railway)

### 4. Deploy
O Railway detecta o nixpacks.toml e sobe automaticamente.

---

## Acesso Admin
- URL: seusite.railway.app/admin
- E-mail: admin@lfbarn.com
- Senha: lfbarn2025

⚠️ Troque a senha após o primeiro acesso!

---

## Rastreamento de Criativos
Para rastrear qual criativo gerou mais vendas, adicione `?c=nome-criativo` nos links:
```
https://seusite.railway.app?c=stories-01
https://seusite.railway.app?c=reels-02
```
Os dados aparecem no Dashboard → Desempenho por Criativo.

---

## WhatsApp
Número configurado: +55 44 99976-9485
Para alterar, busque `5544999769485` nos arquivos `db.js` e `routes/products.js`.
