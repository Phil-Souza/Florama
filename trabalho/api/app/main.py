from decimal import Decimal
from uuid import UUID, uuid4

import psycopg
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from psycopg.errors import UniqueViolation

from .config import CORS_ORIGINS
from .database import get_db
from .schemas import (
    AdminOrderStatusRequest,
    AdminProductAvailabilityRequest,
    AdminProductRequest,
    CartItemRequest,
    LoginRequest,
    OrderCreateRequest,
    ProfileUpdateRequest,
    RegisterRequest,
)
from .security import create_access_token, get_current_user_id, hash_password, verify_password

app = FastAPI(title="Florama API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


def profile_out(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["nome"],
        "email": row["email"],
        "phone": row["telefone"] or "",
        "address": row["endereco"] or "",
        "role": row.get("papel", "cliente"),
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


def admin_product_out(row: dict) -> dict:
    return {
        **product_out(row),
        "categorySlug": row["categoria_slug"],
        "active": row["ativo"],
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


def require_admin(
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
) -> UUID:
    with connection.transaction():
        user = connection.execute(
            "SELECT papel FROM public.perfis WHERE id = %s",
            (user_id,),
        ).fetchone()
    if not user or user["papel"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito à administração.")
    return user_id


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


def normalize_order_status(order: dict) -> str:
    if order["status_pagamento"] == "aprovado" and order["status"] == "aguardando_pagamento":
        return "paga"
    return order["status"]


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
    status = normalize_order_status(order)
    return {
        "id": str(order["id"]),
        "status": status,
        "paymentStatus": order["status_pagamento"],
        "recipientName": order["nome_recebedor"] or "",
        "recipientPhone": order["telefone_recebedor"] or "",
        "deliveryAddress": order["endereco_entrega"] or "",
        "subtotalCents": int(order["subtotal"] * 100),
        "deliveryFeeCents": int(order["taxa_entrega"] * 100),
        "totalCents": int(order["total"] * 100),
        "createdAt": order["criado_em"].isoformat(),
        "items": items,
    }


def admin_order_out(connection: psycopg.Connection, order: dict) -> dict:
    result = order_out(connection, order)
    result.update({
        "customerName": order["cliente_nome"],
        "customerEmail": order["cliente_email"],
        "paymentValidatedAt": (
            order["pagamento_validado_em"].isoformat()
            if order["pagamento_validado_em"] else None
        ),
        "paymentValidatedBy": (
            str(order["pagamento_validado_por"])
            if order["pagamento_validado_por"] else None
        ),
        "paymentValidatorName": order.get("validador_nome"),
    })
    return result


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


@app.get("/api/admin/products")
def list_admin_products(
    _: UUID = Depends(require_admin),
    connection: psycopg.Connection = Depends(get_db),
):
    rows = connection.execute(
        """
        SELECT p.id, p.nome, p.descricao, p.preco, c.nome AS categoria,
               c.slug AS categoria_slug, p.emoji, p.cor_fundo, p.ativo
        FROM public.produtos p
        JOIN public.categorias c ON c.id = p.categoria_id
        ORDER BY p.ativo DESC, c.ordem, p.nome
        """
    ).fetchall()
    return [admin_product_out(row) for row in rows]


@app.post("/api/admin/products", status_code=status.HTTP_201_CREATED)
def create_admin_product(
    payload: AdminProductRequest,
    _: UUID = Depends(require_admin),
    connection: psycopg.Connection = Depends(get_db),
):
    with connection.transaction():
        category = connection.execute(
            "SELECT id FROM public.categorias WHERE slug = %s",
            (payload.category_slug,),
        ).fetchone()
        if not category:
            raise HTTPException(status_code=404, detail="Categoria não encontrada.")
        product = connection.execute(
            """
            INSERT INTO public.produtos
              (categoria_id, nome, descricao, preco, emoji, cor_fundo, ativo)
            VALUES (%s, %s, %s, %s, %s, %s, true)
            RETURNING id
            """,
            (
                category["id"],
                payload.name,
                payload.detail,
                Decimal(payload.price_cents) / 100,
                payload.flower,
                payload.color,
            ),
        ).fetchone()
        created = connection.execute(
            """
            SELECT p.id, p.nome, p.descricao, p.preco, c.nome AS categoria,
                   c.slug AS categoria_slug, p.emoji, p.cor_fundo, p.ativo
            FROM public.produtos p
            JOIN public.categorias c ON c.id = p.categoria_id
            WHERE p.id = %s
            """,
            (product["id"],),
        ).fetchone()
        return admin_product_out(created)


@app.put("/api/admin/products/{product_id}")
def update_admin_product(
    product_id: UUID,
    payload: AdminProductRequest,
    _: UUID = Depends(require_admin),
    connection: psycopg.Connection = Depends(get_db),
):
    with connection.transaction():
        category = connection.execute(
            "SELECT id FROM public.categorias WHERE slug = %s",
            (payload.category_slug,),
        ).fetchone()
        if not category:
            raise HTTPException(status_code=404, detail="Categoria não encontrada.")
        updated = connection.execute(
            """
            UPDATE public.produtos
            SET categoria_id = %s, nome = %s, descricao = %s, preco = %s,
                emoji = %s, cor_fundo = %s
            WHERE id = %s
            RETURNING id
            """,
            (
                category["id"],
                payload.name,
                payload.detail,
                Decimal(payload.price_cents) / 100,
                payload.flower,
                payload.color,
                product_id,
            ),
        ).fetchone()
        if not updated:
            raise HTTPException(status_code=404, detail="Produto não encontrado.")
        product = connection.execute(
            """
            SELECT p.id, p.nome, p.descricao, p.preco, c.nome AS categoria,
                   c.slug AS categoria_slug, p.emoji, p.cor_fundo, p.ativo
            FROM public.produtos p
            JOIN public.categorias c ON c.id = p.categoria_id
            WHERE p.id = %s
            """,
            (product_id,),
        ).fetchone()
        return admin_product_out(product)


@app.patch("/api/admin/products/{product_id}/availability")
def set_admin_product_availability(
    product_id: UUID,
    payload: AdminProductAvailabilityRequest,
    _: UUID = Depends(require_admin),
    connection: psycopg.Connection = Depends(get_db),
):
    with connection.transaction():
        product = connection.execute(
            """
            UPDATE public.produtos
            SET ativo = %s
            WHERE id = %s
            RETURNING id
            """,
            (payload.active, product_id),
        ).fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Produto não encontrado.")
        updated = connection.execute(
            """
            SELECT p.id, p.nome, p.descricao, p.preco, c.nome AS categoria,
                   c.slug AS categoria_slug, p.emoji, p.cor_fundo, p.ativo
            FROM public.produtos p
            JOIN public.categorias c ON c.id = p.categoria_id
            WHERE p.id = %s
            """,
            (product_id,),
        ).fetchone()
        return admin_product_out(updated)


@app.delete("/api/admin/products/{product_id}")
def deactivate_admin_product(
    product_id: UUID,
    _: UUID = Depends(require_admin),
    connection: psycopg.Connection = Depends(get_db),
):
    with connection.transaction():
        product = connection.execute(
            """
            UPDATE public.produtos
            SET ativo = false
            WHERE id = %s
            RETURNING id
            """,
            (product_id,),
        ).fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Produto não encontrado.")
        deactivated = connection.execute(
            """
            SELECT p.id, p.nome, p.descricao, p.preco, c.nome AS categoria,
                   c.slug AS categoria_slug, p.emoji, p.cor_fundo, p.ativo
            FROM public.produtos p
            JOIN public.categorias c ON c.id = p.categoria_id
            WHERE p.id = %s
            """,
            (product_id,),
        ).fetchone()
        return admin_product_out(deactivated)


@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, connection: psycopg.Connection = Depends(get_db)):
    email = str(payload.email).strip().lower()
    user_id = uuid4()
    access_token = create_access_token(user_id)
    password_hash = hash_password(payload.password)
    with connection.transaction():
        try:
            user = connection.execute(
                """
                INSERT INTO public.perfis (id, nome, email, telefone, endereco, senha_hash)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, nome, email, telefone, endereco, papel
                """,
                (user_id, payload.name, email, payload.phone, payload.address, password_hash),
            ).fetchone()
        except UniqueViolation as exc:
            raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado.") from exc
        get_active_cart_id(connection, user["id"])
    return {"accessToken": access_token, "user": profile_out(user)}


@app.post("/api/auth/login")
def login(payload: LoginRequest, connection: psycopg.Connection = Depends(get_db)):
    user = connection.execute(
        """
        SELECT id, nome, email, telefone, endereco, senha_hash, papel
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
        "SELECT id, nome, email, telefone, endereco, papel FROM public.perfis WHERE id = %s",
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
        RETURNING id, nome, email, telefone, endereco, papel
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
        "SELECT produto_id FROM public.favoritos WHERE usuario_id = %s ORDER BY criado_em DESC",
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


@app.post("/api/orders/{order_id}/cancel")
def cancel_order(
    order_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    connection: psycopg.Connection = Depends(get_db),
):
    with connection.transaction():
        order = connection.execute(
            """
            SELECT * FROM public.vendas
            WHERE id = %s AND usuario_id = %s
            FOR UPDATE
            """,
            (order_id, user_id),
        ).fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Pedido não encontrado.")
        if order["status"] == "cancelada":
            return order_out(connection, order)
        if order["status"] != "aguardando_pagamento" or order["status_pagamento"] != "pendente":
            raise HTTPException(
                status_code=409,
                detail="Só é possível cancelar pedidos que aguardam pagamento.",
            )
        updated = connection.execute(
            """
            UPDATE public.vendas
            SET status = 'cancelada'
            WHERE id = %s
            RETURNING *
            """,
            (order_id,),
        ).fetchone()
        return order_out(connection, updated)


@app.get("/api/admin/orders")
def list_admin_orders(
    _: UUID = Depends(require_admin),
    connection: psycopg.Connection = Depends(get_db),
):
    orders = connection.execute(
        """
        SELECT v.*, p.nome AS cliente_nome, p.email AS cliente_email,
               a.nome AS validador_nome
        FROM public.vendas v
        JOIN public.perfis p ON p.id = v.usuario_id
        LEFT JOIN public.perfis a ON a.id = v.pagamento_validado_por
        ORDER BY
          CASE WHEN v.status = 'aguardando_pagamento' THEN 0 ELSE 1 END,
          v.criado_em DESC
        """
    ).fetchall()
    return [admin_order_out(connection, order) for order in orders]


@app.post("/api/admin/orders/{order_id}/confirm-payment")
def confirm_order_payment(
    order_id: UUID,
    admin_id: UUID = Depends(require_admin),
    connection: psycopg.Connection = Depends(get_db),
):
    with connection.transaction():
        order = connection.execute(
            """
            SELECT status, status_pagamento, pagamento_validado_por, pagamento_validado_em
            FROM public.vendas WHERE id = %s FOR UPDATE
            """,
            (order_id,),
        ).fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Pedido não encontrado.")

        if order["status_pagamento"] == "aprovado":
            if order["status"] == "aguardando_pagamento":
                connection.execute(
                    "UPDATE public.vendas SET status = 'paga' WHERE id = %s",
                    (order_id,),
                )
            if order["pagamento_validado_por"] is None or order["pagamento_validado_em"] is None:
                connection.execute(
                    """
                    UPDATE public.vendas
                    SET pagamento_validado_por = %s, pagamento_validado_em = now()
                    WHERE id = %s
                    """,
                    (admin_id, order_id),
                )
            updated = connection.execute(
                """
                SELECT v.*, p.nome AS cliente_nome, p.email AS cliente_email,
                       a.nome AS validador_nome
                FROM public.vendas v
                JOIN public.perfis p ON p.id = v.usuario_id
                LEFT JOIN public.perfis a ON a.id = v.pagamento_validado_por
                WHERE v.id = %s
                """,
                (order_id,),
            ).fetchone()
            return admin_order_out(connection, updated)

        if order["status"] != "aguardando_pagamento" or order["status_pagamento"] != "pendente":
            raise HTTPException(
                status_code=409,
                detail="Só é possível validar pagamentos de pedidos aguardando pagamento.",
            )
        connection.execute(
            """
            UPDATE public.vendas
            SET status = 'paga', status_pagamento = 'aprovado',
                pagamento_validado_por = %s, pagamento_validado_em = now()
            WHERE id = %s
            """,
            (admin_id, order_id),
        )
        updated = connection.execute(
            """
            SELECT v.*, p.nome AS cliente_nome, p.email AS cliente_email,
                   a.nome AS validador_nome
            FROM public.vendas v
            JOIN public.perfis p ON p.id = v.usuario_id
            LEFT JOIN public.perfis a ON a.id = v.pagamento_validado_por
            WHERE v.id = %s
            """,
            (order_id,),
        ).fetchone()
        return admin_order_out(connection, updated)


@app.patch("/api/admin/orders/{order_id}/status")
def update_admin_order_status(
    order_id: UUID,
    payload: AdminOrderStatusRequest,
    _: UUID = Depends(require_admin),
    connection: psycopg.Connection = Depends(get_db),
):
    allowed_next_status = {
        "aguardando_pagamento": {"cancelada"},
        "paga": {"em_preparo"},
        "em_preparo": {"pronta_entrega"},
        "pronta_entrega": {"concluida"},
        "concluida": set(),
        "cancelada": set(),
    }
    with connection.transaction():
        order = connection.execute(
            "SELECT status FROM public.vendas WHERE id = %s FOR UPDATE",
            (order_id,),
        ).fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Pedido não encontrado.")
        if payload.status not in allowed_next_status[order["status"]]:
            raise HTTPException(status_code=409, detail="Transição de status não permitida.")
        connection.execute(
            "UPDATE public.vendas SET status = %s WHERE id = %s",
            (payload.status, order_id),
        )
        updated = connection.execute(
            """
            SELECT v.*, p.nome AS cliente_nome, p.email AS cliente_email,
                   a.nome AS validador_nome
            FROM public.vendas v
            JOIN public.perfis p ON p.id = v.usuario_id
            LEFT JOIN public.perfis a ON a.id = v.pagamento_validado_por
            WHERE v.id = %s
            """,
            (order_id,),
        ).fetchone()
        return admin_order_out(connection, updated)


@app.delete("/api/admin/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_order(
    order_id: UUID,
    _: UUID = Depends(require_admin),
    connection: psycopg.Connection = Depends(get_db),
):
    with connection.transaction():
        order = connection.execute(
            """
            SELECT status, status_pagamento, pagamento_validado_por, pagamento_validado_em
            FROM public.vendas
            WHERE id = %s
            FOR UPDATE
            """,
            (order_id,),
        ).fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Pedido não encontrado.")
        if (
            order["status"] != "cancelada"
            or order["status_pagamento"] != "pendente"
            or order["pagamento_validado_por"] is not None
            or order["pagamento_validado_em"] is not None
        ):
            raise HTTPException(
                status_code=409,
                detail="Só é possível excluir pedidos cancelados e sem pagamento validado.",
            )
        connection.execute("DELETE FROM public.vendas WHERE id = %s", (order_id,))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
