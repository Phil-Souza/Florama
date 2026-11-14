from decimal import Decimal
from uuid import UUID

import psycopg
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from psycopg.errors import UniqueViolation

from .config import CORS_ORIGINS
from .database import get_db
from .schemas import CartItemRequest, LoginRequest, OrderCreateRequest, ProfileUpdateRequest, RegisterRequest
from .security import create_access_token, get_current_user_id, hash_password, verify_password

app = FastAPI(title="Florama API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


def profile_out(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["nome"],
        "email": row["email"],
        "phone": row["telefone"] or "",
        "address": row["endereco"] or "",
    }


def product_out(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["nome"],
        "detail": row["descricao"],
        "priceCents": int(row["preco"] * 100),
        "category": row["categoria"],
        "flower": row["emoji"],
        "color": row["cor_fundo"],
    }


def get_active_cart_id(connection: psycopg.Connection, user_id: UUID) -> UUID:
    cart = connection.execute(
        "SELECT id FROM public.carrinhos WHERE usuario_id = %s AND status = 'ativo'",
        (user_id,),
    ).fetchone()
    if cart:
        return cart["id"]
    created = connection.execute(
        "INSERT INTO public.carrinhos (usuario_id) VALUES (%s) RETURNING id",
        (user_id,),
    ).fetchone()
    return created["id"]


def cart_out(connection: psycopg.Connection, cart_id: UUID) -> dict:
    rows = connection.execute(
        """
        SELECT p.id, p.nome, p.descricao, p.preco, c.nome AS categoria,
               p.emoji, p.cor_fundo, ic.quantidade
        FROM public.itens_carrinho ic
        JOIN public.produtos p ON p.id = ic.produto_id
        JOIN public.categorias c ON c.id = p.categoria_id
        WHERE ic.carrinho_id = %s AND p.ativo = true
        ORDER BY p.nome
        """,
        (cart_id,),
    ).fetchall()
    items = [
        {
            "productId": str(row["id"]),
            "quantity": row["quantidade"],
            "product": product_out(row),
        }
        for row in rows
    ]
    return {
        "items": items,
        "count": sum(item["quantity"] for item in items),
        "subtotalCents": sum(item["product"]["priceCents"] * item["quantity"] for item in items),
    }


def order_out(connection: psycopg.Connection, order: dict) -> dict:
    rows = connection.execute(
        """
        SELECT produto_id, nome_produto, descricao_produto, preco_unitario, quantidade
        FROM public.itens_venda
        WHERE venda_id = %s
        ORDER BY id
        """,
        (order["id"],),
    ).fetchall()
    items = [
        {
            "productId": str(row["produto_id"]) if row["produto_id"] else None,
            "name": row["nome_produto"],
            "detail": row["descricao_produto"],
            "unitPriceCents": int(row["preco_unitario"] * 100),
            "quantity": row["quantidade"],
        }
        for row in rows
    ]
    return {
        "id": str(order["id"]),
        "status": order["status"],
        "paymentStatus": order["status_pagamento"],
        "subtotalCents": int(order["subtotal"] * 100),
        "deliveryFeeCents": int(order["taxa_entrega"] * 100),
        "totalCents": int(order["total"] * 100),
        "createdAt": order["criado_em"].isoformat(),
        "items": items,
    }


@app.get("/health")
def health(connection: psycopg.Connection = Depends(get_db)):
    connection.execute("SELECT 1").fetchone()
    return {"status": "ok", "database": "connected"}


@app.get("/api/categories")
def list_categories(connection: psycopg.Connection = Depends(get_db)):
    rows = connection.execute(
        "SELECT slug, nome, ordem FROM public.categorias ORDER BY ordem"
    ).fetchall()
    return [{"slug": row["slug"], "name": row["nome"], "order": row["ordem"]} for row in rows]


@app.get("/api/products")
def list_products(
    category: str | None = None,
    connection: psycopg.Connection = Depends(get_db),
):
    rows = connection.execute(
        """
        SELECT p.id, p.nome, p.descricao, p.preco, c.nome AS categoria,
               p.emoji, p.cor_fundo
        FROM public.produtos p
        JOIN public.categorias c ON c.id = p.categoria_id
        WHERE p.ativo = true AND (%s::text IS NULL OR c.slug = %s)
        ORDER BY c.ordem, p.nome
        """,
        (category, category),
    ).fetchall()
    return [product_out(row) for row in rows]


@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, connection: psycopg.Connection = Depends(get_db)):
    email = str(payload.email).strip().lower()
    with connection.transaction():
        try:
            user = connection.execute(
                """
                INSERT INTO public.perfis (nome, email, telefone, endereco, senha_hash)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, nome, email, telefone, endereco
                """,
                (payload.name.strip(), email, payload.phone.strip(), payload.address.strip(), hash_password(payload.password)),
            ).fetchone()
        except UniqueViolation as exc:
            raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado.") from exc
        get_active_cart_id(connection, user["id"])
    return {"accessToken": create_access_token(user["id"]), "user": profile_out(user)}


@app.post("/api/auth/login")
def login(payload: LoginRequest, connection: psycopg.Connection = Depends(get_db)):
    user = connection.execute(
        """
        SELECT id, nome, email, telefone, endereco, senha_hash
        FROM public.perfis WHERE lower(email) = %s
        """,
        (str(payload.email).strip().lower(),),
    ).fetchone()
    if not user or not verify_password(payload.password, user["senha_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    return {"accessToken": create_access_token(user["id"]), "user": profile_out(user)}


@app.get("/api/profile")
def get_profile(
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
):
    user = connection.execute(
        "SELECT id, nome, email, telefone, endereco FROM public.perfis WHERE id = %s",
        (user_id,),
    ).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Perfil não encontrado.")
    return profile_out(user)


@app.put("/api/profile")
def update_profile(
    payload: ProfileUpdateRequest,
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
):
    user = connection.execute(
        """
        UPDATE public.perfis SET nome = %s, telefone = %s, endereco = %s
        WHERE id = %s
        RETURNING id, nome, email, telefone, endereco
        """,
        (payload.name.strip(), payload.phone.strip(), payload.address.strip(), user_id),
    ).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Perfil não encontrado.")
    connection.commit()
    return profile_out(user)


@app.get("/api/favorites")
def list_favorites(
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
):
    rows = connection.execute(
        "SELECT produto_id FROM public.favoritos WHERE usuario_id = %s ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    return {"productIds": [str(row["produto_id"]) for row in rows]}


@app.put("/api/favorites/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def add_favorite(
    product_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
):
    product = connection.execute(
        "SELECT id FROM public.produtos WHERE id = %s AND ativo = true", (product_id,)
    ).fetchone()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    connection.execute(
        "INSERT INTO public.favoritos (usuario_id, produto_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
        (user_id, product_id),
    )
    connection.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.delete("/api/favorites/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    product_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
):
    connection.execute(
        "DELETE FROM public.favoritos WHERE usuario_id = %s AND produto_id = %s",
        (user_id, product_id),
    )
    connection.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/cart")
def get_cart(
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
):
    with connection.transaction():
        cart_id = get_active_cart_id(connection, user_id)
        return cart_out(connection, cart_id)


@app.put("/api/cart/items/{product_id}")
def set_cart_item(
    product_id: UUID,
    payload: CartItemRequest,
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
):
    with connection.transaction():
        cart_id = get_active_cart_id(connection, user_id)
        result = connection.execute(
            """
            INSERT INTO public.itens_carrinho (carrinho_id, produto_id, quantidade)
            SELECT %s, id, %s FROM public.produtos WHERE id = %s AND ativo = true
            ON CONFLICT (carrinho_id, produto_id) DO UPDATE SET quantidade = EXCLUDED.quantidade
            """,
            (cart_id, payload.quantity, product_id),
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Produto não encontrado.")
        return cart_out(connection, cart_id)


@app.delete("/api/cart/items/{product_id}")
def delete_cart_item(
    product_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
):
    with connection.transaction():
        cart_id = get_active_cart_id(connection, user_id)
        connection.execute(
            "DELETE FROM public.itens_carrinho WHERE carrinho_id = %s AND produto_id = %s",
            (cart_id, product_id),
        )
        return cart_out(connection, cart_id)


@app.post("/api/orders", status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreateRequest,
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
):
    with connection.transaction():
        profile = connection.execute(
            "SELECT nome, telefone, endereco FROM public.perfis WHERE id = %s",
            (user_id,),
        ).fetchone()
        if not profile or not profile["nome"] or not profile["telefone"] or not profile["endereco"]:
            raise HTTPException(status_code=400, detail="Complete seu perfil antes de finalizar o pedido.")

        cart_id = get_active_cart_id(connection, user_id)
        items = connection.execute(
            """
            SELECT p.id, p.nome, p.descricao, p.preco, ic.quantidade
            FROM public.itens_carrinho ic
            JOIN public.produtos p ON p.id = ic.produto_id
            WHERE ic.carrinho_id = %s AND p.ativo = true
            FOR UPDATE OF p
            """,
            (cart_id,),
        ).fetchall()
        if not items:
            raise HTTPException(status_code=400, detail="A sacola está vazia.")

        subtotal = sum((row["preco"] * row["quantidade"] for row in items), Decimal("0.00"))
        delivery_fee = Decimal("0.00")
        total = subtotal + delivery_fee
        sale = connection.execute(
            """
            INSERT INTO public.vendas
              (usuario_id, status, forma_pagamento, status_pagamento, subtotal,
               taxa_entrega, total, nome_recebedor, telefone_recebedor, endereco_entrega)
            VALUES (%s, 'aguardando_pagamento', %s, 'pendente', %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                user_id, payload.forma_pagamento, subtotal, delivery_fee, total,
                profile["nome"], profile["telefone"], profile["endereco"],
            ),
        ).fetchone()
        for item in items:
            connection.execute(
                """
                INSERT INTO public.itens_venda
                  (venda_id, produto_id, nome_produto, descricao_produto, preco_unitario, quantidade)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (sale["id"], item["id"], item["nome"], item["descricao"], item["preco"], item["quantidade"]),
            )
        connection.execute("UPDATE public.carrinhos SET status = 'convertido' WHERE id = %s", (cart_id,))
        get_active_cart_id(connection, user_id)
        return order_out(connection, sale)


@app.get("/api/orders")
def list_orders(
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
):
    orders = connection.execute(
        "SELECT * FROM public.vendas WHERE usuario_id = %s ORDER BY criado_em DESC",
        (user_id,),
    ).fetchall()
    return [order_out(connection, order) for order in orders]


@app.get("/api/orders/{order_id}")
def get_order(
    order_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
):
    order = connection.execute(
        "SELECT * FROM public.vendas WHERE id = %s AND usuario_id = %s",
        (order_id, user_id),
    ).fetchone()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
    return order_out(connection, order)
