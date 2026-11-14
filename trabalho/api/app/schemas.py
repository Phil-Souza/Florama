from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=8, max_length=30)
    address: str = Field(min_length=5, max_length=300)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProfileUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=30)
    address: str = Field(min_length=5, max_length=300)


class CartItemRequest(BaseModel):
    quantity: int = Field(ge=1, le=99)


class OrderCreateRequest(BaseModel):
    forma_pagamento: str | None = Field(default=None, max_length=40)