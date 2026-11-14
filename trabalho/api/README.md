# Florama API

API FastAPI conectada ao PostgreSQL `florama`. Ela usa as tabelas já criadas: `categorias`, `produtos`, `perfis`, `favoritos`, `carrinhos`, `itens_carrinho`, `vendas` e `itens_venda`.

## Preparar uma vez

1. Copie `api/.env.example` para `api/.env` e preencha a senha do PostgreSQL e uma chave secreta JWT longa. Não compartilhe nem versione `api/.env`.
2. No pgAdmin, abra o banco `florama`, abra o Query Tool e execute `api/migrations/001_auth_profile.sql`. A migração adiciona hash de senha e endereço à tabela `perfis`.
3. Na pasta do projeto, instale os pacotes Python:

   ```powershell
   py -m pip install -r api/requirements.txt
   ```

4. Inicie o servidor:

   ```powershell
   cd api
   py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

A documentação interativa fica em `http://localhost:8000/docs` e a verificação em `http://localhost:8000/health`.

## Expo Go em um celular Android

Crie `.env.local` na raiz do projeto com o endereço IPv4 do computador na mesma rede Wi-Fi:

```env
EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:8000
```

Use o endereço IPv4 mostrado por `ipconfig`, por exemplo `http://192.168.1.98:8000`. O firewall do Windows deve permitir conexões privadas na porta 8000. No emulador Android, use `http://10.0.2.2:8000`.

O endereço `EXPO_PUBLIC_API_URL` é público no app; ele só contém o endereço do servidor. Nunca coloque senha do PostgreSQL ou `JWT_SECRET` em uma variável `EXPO_PUBLIC_`.

## Rotas

- `GET /health`, `GET /api/categories`, `GET /api/products`
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/PUT /api/profile`
- `GET /api/favorites`, `PUT/DELETE /api/favorites/{product_id}`
- `GET /api/cart`, `PUT/DELETE /api/cart/items/{product_id}`
- `POST /api/orders`, `GET /api/orders`, `GET /api/orders/{order_id}`

`POST /api/orders` cria a venda com preços lidos do banco dentro de uma transação, grava cópias de nome, descrição e preço em `itens_venda`, converte o carrinho atual e abre um novo carrinho ativo. O pagamento permanece pendente; a API não processa pagamentos.
