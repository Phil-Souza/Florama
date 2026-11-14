import type { ProfileData } from "@/context/StoreContext";

export type RegistrationData = ProfileData & {
  password: string;
  confirmPassword: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.(com|br)$/i;
const allowedPhoneCharacters = /^[\d\s().-]+$/;
const phonePattern = /^\d{2}9\d{8}$/;

export function phoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function formatPhoneInput(value: string) {
  const digits = phoneDigits(value);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function validateRegistration(data: RegistrationData): string | null {
  const name = data.name.trim();
  if (name.length < 2) return "Informe seu nome completo.";
  if (name.length > 64) return "O nome deve ter no máximo 64 caracteres.";

  const email = data.email.trim();
  if (!emailPattern.test(email)) return "Informe um e-mail válido terminado em .com ou .br.";

  const phone = data.phone.trim();
  if (!allowedPhoneCharacters.test(phone) || !phonePattern.test(phoneDigits(phone))) {
    return "Informe um celular com DDD e 11 dígitos: (11) 91234-5678.";
  }

  if (data.address.trim().length < 5) return "Informe um endereço de entrega com pelo menos 5 caracteres.";
  if (data.password.length < 8 || data.password.length > 128) {
    return "A senha deve ter entre 8 e 128 caracteres.";
  }
  if (data.password !== data.confirmPassword) return "As senhas não coincidem.";

  return null;
}
