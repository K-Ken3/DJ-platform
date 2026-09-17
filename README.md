# DJ Song Request Platform

A full-stack DJ platform with:

- Premium public DJ website
- QR song request flow
- Real-time requests via Socket.IO
- DJ admin dashboard
- MTN Mobile Money USSD tip flow
- SQLite development database, designed for PostgreSQL-style app architecture

## Quick start

1. Install dependencies:
   npm install
2. Copy env file:
   cp .env.example .env
3. Start development servers:
   npm run dev

## Default admin login

- Email: dj@vaxino.com
- Password: djadmin123

## Public request URLs

- Home: http://localhost:3000
- Request page: http://localhost:3000/request/dj-vaxino
- Admin: http://localhost:3000/admin/login

## Backend API

- http://localhost:4000/api/health

## Notes

This project is intentionally built as a working MVP aligned to the product brief. It is designed for local development and can be adapted to PostgreSQL in production.
