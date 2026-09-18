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

- Email: karasiraken5@gmail.com
- Password: 20060Ken

> This is the platform owner (SUPERADMIN) account. DJs register through the public site and are approved by the owner. No demo DJ accounts are seeded.

## Public URLs

- Home: http://localhost:3000
- DJ profile: http://localhost:3000/dj/<slug>
- Request page: http://localhost:3000/request/<slug>
- Admin: http://localhost:3000/admin/login

## Backend API

- http://localhost:4000/api/health

## Notes

This project is intentionally built as a working MVP aligned to the product brief. It is designed for local development and can be adapted to PostgreSQL in production.
