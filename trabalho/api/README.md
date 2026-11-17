# Florama API

API FastAPI conectada ao PostgreSQL `florama`. Ela usa as tabelas já criadas: `categorias`, `produtos`, `perfis`, `favoritos`, `carrinhos`, `itens_carrinho`, `vendas` e `itens_venda`.

## Preparar uma vez

1. Copie `api/.env.example` para `api/.env` e preencha a senha do PostgreSQL e uma chave secreta JWT longa. Não compartilhe nem versione `api/.env`.
2. No pgAdmin, abra o banco `florama`, abra o Query Tool e execute, nesta ordem, `api/migrations/001_auth_profile.sql` e `api/migrations/002_admin_payment_audit.sql`. A segunda migração adiciona o papel de usuário e os campos de auditoria do pagamento.
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

Use `.env.example` como referência para criar ou atualizar `.env.local` na raiz do projeto. Preserve as configurações locais existentes e inclua o endereço IPv4 do computador e o número comercial:

```env
EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:8000
EXPO_PUBLIC_WHATSAPP_NUMBER=
```

Use no `EXPO_PUBLIC_API_URL` o endereço IPv4 mostrado por `ipconfig`, por exemplo `http://192.168.1.98:8000`. Preencha `EXPO_PUBLIC_WHATSAPP_NUMBER` com o número comercial em formato internacional, somente dígitos, sem `+`, espaços ou pontuação. O número deve ser fornecido pelo responsável pela loja; não há número padrão. O firewall do Windows deve permitir conexões privadas na porta 8000. No emulador Android, use `http://10.0.2.2:8000`.

Essas variáveis `EXPO_PUBLIC_` são incorporadas ao app e são públicas. Nunca coloque senha do PostgreSQL, `JWT_SECRET` ou outros segredos nelas. Se o número comercial não estiver configurado ou não for possível abrir o WhatsApp, o app permite copiar os dados do pedido. A mensagem contém somente o número do pedido, itens, quantidades e total; o cliente ainda precisa enviá-la.

## Promover uma conta existente a administradora

Crie primeiro uma conta normalmente pelo app e confirme o e-mail correspondente. Depois, no pgAdmin, abra o Query Tool do banco `florama` e execute a instrução abaixo substituindo o e-mail pelo da conta existente:

```sql
UPDATE public.perfis
SET papel = 'admin'
WHERE lower(email) = lower('email-da-conta-existente@example.com')
RETURNING id, email, papel;
```

Confirme que exatamente a conta pretendida foi retornada como `admin`. Não existe senha padrão nem rota pública para promoção. O backend consulta o papel salvo no banco em cada requisição administrativa; o papel padrão de novos perfis é `cliente`.

## Rotas

- `GET /health`, `GET /api/categories`, `GET /api/products`
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/PUT /api/profile`
- `GET /api/favorites`, `PUT/DELETE /api/favorites/{product_id}`
- `GET /api/cart`, `PUT/DELETE /api/cart/items/{product_id}`
- `POST /api/orders`, `GET /api/orders`, `GET /api/orders/{order_id}`, `POST /api/orders/{order_id}/cancel` (o cliente pode cancelar apenas o próprio pedido enquanto aguarda pagamento)
- `GET /api/admin/orders`, `POST /api/admin/orders/{order_id}/confirm-payment`, `PATCH /api/admin/orders/{order_id}/status` (somente administradores)
- `DELETE /api/admin/orders/{order_id}` (somente administradores; exclui definitivamente apenas pedidos cancelados, pendentes e sem auditoria de pagamento)
- `GET/POST /api/admin/products`, `PUT /api/admin/products/{product_id}`, `PATCH /api/admin/products/{product_id}/availability`, `DELETE /api/admin/products/{product_id}` (somente administradores)

O cadastro exige nome de 2 a 64 caracteres, e-mail válido terminado em `.com` ou `.br`, celular brasileiro com 11 dígitos no formato `DD9XXXXXXXX`, senha entre 8 e 128 caracteres, confirmação idêntica à senha e endereço com pelo menos 5 caracteres. O formulário e a API validam os dados; a API só grava o perfil e cria a sacola dentro de uma transação depois de validar a requisição e preparar a resposta de autenticação.

`POST /api/orders` cria a venda com preços lidos do banco dentro de uma transação, grava cópias de nome, descrição e preço em `itens_venda`, converte o carrinho atual e abre um novo carrinho ativo. A taxa de entrega está configurada como grátis (R$ 0,00). O pagamento permanece pendente; a API não processa pagamentos.

Após receber o pedido criado pela API, o app tenta abrir `wa.me` com o pedido, itens, quantidades e total. Isso não altera o status de pagamento e não envia a mensagem automaticamente. Administradores devem conferir o recebimento no extrato/conta antes de validar; comprovantes enviados pelo cliente não são confirmação automática. A validação registra o administrador e o horário, é idempotente, e o andamento só aceita transições definidas pela API.

Na área administrativa, a exclusão é individual e exige confirmação. Só pedidos já cancelados, ainda pendentes e sem registro de validação podem ser excluídos; pedidos pagos ou em andamento permanecem no histórico para preservar a auditoria. Os itens associados são removidos em cascata pelo vínculo existente no banco.

Administradores podem criar e editar produtos do catálogo. A ação de remover desativa o produto (`ativo = false`) em vez de apagá-lo fisicamente, preservando referências de favoritos, carrinhos e pedidos antigos. Produtos inativos não são retornados ao catálogo público nem podem ser adicionados à sacola; podem ser reativados pela tela administrativa. Não é necessária migração adicional para essa funcionalidade.
