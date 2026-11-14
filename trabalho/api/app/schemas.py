from typing import Literal
from pydantic import field_validator
import re
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=64)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=11, max_length=11)
    address: str = Field(min_length=5, max_length=300)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("As senhas não coincidem.")
        return self

    @field_validator("name", "address", mode="before")
    @classmethod
    def trim_text(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator("email")
    @classmethod
    def validate_registration_email(cls, value: EmailStr) -> str:
        email = str(value).strip().lower()
        if not email.endswith((".com", ".br")):
            raise ValueError("O e-mail deve terminar em .com ou .br.")
        return email

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        if not isinstance(value, str) or not re.fullmatch(r"[\d\s().-]+", value):
            raise ValueError("Informe somente um número de celular brasileiro.")
        return re.sub(r"\D", "", value)

    @field_validator("phone")
    @classmethod
    def validate_phone_format(cls, value: str) -> str:
        if not re.fullmatch(r"\d{2}9\d{8}", value):
            raise ValueError("O celular deve ter DDD, o número 9 e mais 8 dígitos.")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=30)
    address: str = Field(min_length=5, max_length=300)


class AdminOrderStatusRequest(BaseModel):
    status: Literal["em_preparo", "pronta_entrega", "concluida", "cancelada"]


class CartItemRequest(BaseModel):
    quantity: int = Field(ge=1, le=99)


class OrderCreateRequest(BaseModel):
    forma_pagamento: str | None = Field(default=None, max_length=40)