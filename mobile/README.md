# Billzen Authenticator (APK)

App móvil Android que actúa como autenticador (TOTP) de la app de escritorio Billzen.
Proyecto independiente: no comparte código con `backend/`, `frontend/` ni con la web (`bill_zen_users`);
solo comparte identidad visual y el contrato de la API.

## Alcance (MVP)
1. Escanear el QR de vinculación mostrado por la app de escritorio.
2. Guardar el secreto de forma segura en el dispositivo.
3. Mostrar el código de 6 dígitos con cuenta regresiva de 30 s.

## Contrato con el backend
Ver `docs/` (endpoints `/api/2fa/setup` y `/api/2fa/verify`).

## Salida
Artefacto final: `billzenERP.apk` (publicado en GitHub Releases).
