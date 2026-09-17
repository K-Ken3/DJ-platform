# MASTER PROMPT — DJ WEBSITE + REAL-TIME SONG REQUEST & MTN MOBILE MONEY TIPPING PLATFORM

Build a modern, production-ready website for a professional DJ. The website should combine a **small DJ portfolio/blog** with a **QR-code-based real-time song request system** that can be used at clubs, parties, events, weddings, lounges, and live DJ performances.

The most important feature is **NOT the blog**. The core product is the **real-time song request system**.

---

## 1. PRODUCT CONCEPT

The DJ will have a QR code displayed at a club, party, event, table, screen, poster, or DJ booth.

A guest scans the QR code using their phone.

The QR code opens a simple mobile-first request page.

The guest sees:

- DJ logo
- Short welcome message
- Song Name input
- Artist Name input (optional)
- REQUEST button
- DONATE A TIP button

After submitting:

1. The request is immediately sent to the backend.
2. The DJ receives the request in real time on their private DJ dashboard.
3. The dashboard displays the requested song.
4. Show exactly how long ago the request was submitted:
   - `Just now`
   - `12 sec ago`
   - `1 min ago`
   - `5 mins ago`
   - etc.
5. The DJ can manage the request.
6. The guest receives confirmation that their request was submitted.

The experience should feel extremely fast and simple.

---

# 2. USER TYPES

Create two primary experiences.

### Guest

A person who scans the QR code and requests a song.

They should NOT need:

- An account
- Registration
- Login
- A long form
- To download an app

The process should take only a few seconds.

### DJ / Admin

The DJ has a secure private dashboard where they can:

- See incoming requests instantly
- See the exact time each request was created
- See how long ago each request was made
- Mark requests as played
- Reject/delete requests
- View request history
- Manage their profile
- Manage blog/portfolio content
- Configure the request page
- Configure tipping information
- Generate/download QR codes

---

# 3. PUBLIC WEBSITE

Create a stylish DJ portfolio website.

The website should have a premium nightlife/music aesthetic.

## Hero

Display:

- DJ logo
- DJ name
- Professional tagline
- Short introduction
- CTA button: `REQUEST A SONG`
- CTA button: `BOOK THE DJ`

The design should immediately communicate:

**DJ + Music + Nightlife + Technology**

## About

A short DJ biography.

Include:

- DJ introduction
- Music style
- Experience
- Events performed at
- Location
- Social media links

## Portfolio / Events

Display previous events.

Each event can contain:

- Event name
- Date
- Location
- Description
- Image
- Optional video

## Blog

Create a small blog section.

The DJ should be able to publish posts from the admin dashboard.

Blog fields:

- Title
- Slug
- Featured image
- Short description
- Full content
- Category
- Published date
- Status

The blog should NOT dominate the website.

The primary purpose of the platform remains the song-request system.

## Contact / Booking

Create a booking/contact section.

Include:

- Name
- Email
- Phone
- Event type
- Event date
- Message
- SEND REQUEST button

Also provide social media links.

---

# 4. SONG REQUEST SYSTEM

This is the **MAIN FEATURE**.

Create a dedicated route such as:

`/request/:djSlug`

or:

`/request/:eventCode`

The QR code should point directly to this page.

Example:

`https://website.com/request/dj-vaxino`

The system must support different DJs/events in the future, so do NOT hard-code the request page for only one DJ.

---

# 5. REQUEST PAGE DESIGN

The request page should be extremely simple and mobile-first.

The screen should contain:

### Top

DJ logo

DJ name

Short message such as:

> "What should I play next?"

Then display one beautiful card.

Inside the card:

### Input 1

Label:

`Song Name`

Placeholder:

`Enter the song you want to hear`

Required.

### Input 2

Label:

`Artist Name`

Placeholder:

`Artist name (optional)`

Optional.

### Main button

`REQUEST`

This should be the primary CTA.

Under it, add a smaller secondary button:

`DONATE A TIP`

The tip button should be visually noticeable but should NOT overpower the song request button.

---

# 6. REQUEST SUBMISSION

When the guest clicks REQUEST:

Validate:

- Song name is required
- Artist name is optional
- Prevent empty submissions
- Trim whitespace
- Apply reasonable maximum lengths
- Prevent obvious spam submissions

On successful submission:

Show a confirmation state.

Example:

> 🎵 Request sent!
>
> Your song request has been sent to the DJ.

Optionally show:

`Request received just now`

Provide:

`REQUEST ANOTHER SONG`

Do NOT force the guest to create an account.

---

# 7. REAL-TIME DJ DASHBOARD

Create a private admin dashboard.

The dashboard should receive requests in real time without requiring the DJ to refresh the page.

When a new request arrives:

- Immediately display it
- Optionally play a subtle notification sound
- Show a visual notification
- Move the newest request to the top

Each request card should display:

### Song

`Blinding Lights`

### Artist

`The Weeknd`

### Requested

`12 sec ago`

Also display:

- Request ID
- Exact timestamp
- Status

Statuses:

- `NEW`
- `PLAYED`
- `REJECTED`

---

# 8. REQUEST QUEUE

Create a request queue.

Example:

NEW REQUESTS

--------------------------------

🎵 Blinding Lights
The Weeknd

Requested 12 sec ago

[PLAYED] [REJECT]

--------------------------------

🎵 Calm Down
Rema

Requested 1 min ago

[PLAYED] [REJECT]

--------------------------------

🎵 One Dance
Drake

Requested 4 mins ago

[PLAYED] [REJECT]

--------------------------------

The DJ should be able to process requests quickly while performing.

---

# 9. REQUEST TIMER

The time since the request was created must update automatically.

Example:

Immediately:

`Just now`

After 10 seconds:

`10 sec ago`

After 60 seconds:

`1 min ago`

After 5 minutes:

`5 mins ago`

Do not require a page refresh.

Use the server's timestamp as the source of truth.

---

# 10. REAL-TIME TECHNOLOGY

Use a real-time architecture.

Preferred approach:

### Frontend

React / Next.js

Tailwind CSS

### Backend

Node.js

Express.js

### Database

PostgreSQL

### Real-time communication

WebSockets / Socket.IO.

When a guest submits a request:

Guest

↓

API

↓

PostgreSQL

↓

Socket.IO event

↓

DJ dashboard

The dashboard should receive the new request immediately.

Do NOT implement real-time behavior using repeated polling unless there is a strong technical reason.

---

# 11. DATABASE DESIGN

Design a scalable relational database.

At minimum include:

### users

- id
- name
- email
- password_hash
- role
- created_at
- updated_at

Roles:

- ADMIN
- DJ

### djs

- id
- user_id
- name
- slug
- logo
- bio
- tagline
- location
- social_links
- created_at
- updated_at

### events

- id
- dj_id
- name
- venue
- event_date
- event_code
- active
- created_at
- updated_at

### song_requests

- id
- dj_id
- event_id
- song_name
- artist_name
- status
- requested_at
- played_at
- rejected_at

Status:

`NEW`

`PLAYED`

`REJECTED`

### tips

- id
- dj_id
- event_id
- amount
- currency
- payment_status
- transaction_reference
- created_at

### blog_posts

- id
- dj_id
- title
- slug
- excerpt
- content
- featured_image
- category
- status
- published_at
- created_at
- updated_at

---

# 12. QR CODE SYSTEM

The admin dashboard must allow the DJ to generate a QR code.

The QR code should encode the correct request URL.

Example:

`https://domain.com/request/dj-vaxino`

or an event-specific URL:

`https://domain.com/request/dj-vaxino/event/party-2026`

Provide buttons:

`GENERATE QR`

`DOWNLOAD PNG`

`PRINT QR`

The QR code should work reliably on mobile devices.

---

# 13. EVENT MODE

The platform should support temporary event sessions.

For example:

DJ performs at:

`Saturday Night — Kigali`

The DJ creates an event.

The system generates a unique QR code for that event.

All requests scanned from that QR code are associated with that event.

After the event:

The DJ can deactivate the event.

Historical requests remain available.

---

# 14. DONATE A TIP — MTN MOBILE MONEY

The tipping system will use **MTN Mobile Money in Rwanda**.

The `DONATE A TIP` button should provide a very simple mobile-money experience.

### Primary behavior

When the guest taps:

`DONATE A TIP`

the application should open the phone's dialer/call interface with the MTN Mobile Money USSD code pre-filled:

`*182*1*1*0789630452#`

The goal is for the user to continue the MTN Mobile Money process directly from their phone.

### Important implementation requirements

Use the appropriate mobile deep-link/USSD mechanism supported by the target mobile browser/device.

For example, investigate support for a `tel:`/USSD-style URI and implement the most compatible approach for Android browsers and supported devices.

Do NOT assume that every browser, iPhone, or desktop environment will execute USSD automatically.

### Mobile behavior

On supported mobile devices:

1. User taps `DONATE A TIP`.
2. The phone attempts to open the dialer/USSD interface.
3. The USSD code is pre-filled:
   `*182*1*1*0789630452#`
4. User completes the MTN Mobile Money transaction.

### Desktop behavior

If the device cannot launch a USSD/dialer interface:

Show a fallback modal/card:

**DONATE A TIP**

`Use MTN Mobile Money`

Number:

`0789630452`

USSD:

`*182*1*1*0789630452#`

Include:

`COPY CODE`

and

`COPY NUMBER`

buttons.

Also explain:

> Open your phone dialer and enter the code above to send a tip.

### Important

Do not attempt to process or store the user's MTN Mobile Money PIN.

Do not ask users to enter their PIN into the website.

The website should only initiate the USSD flow or provide the official USSD instructions.

Do NOT implement a fake payment-success screen.

Because this is a direct USSD payment flow, do not claim that the website has verified the payment unless a proper MTN Mobile Money API/webhook integration is implemented later.

---

# 15. TIP CONFIGURATION

For the initial version, use the configured MTN Mobile Money recipient:

`0789630452`

Keep this value configurable through environment variables or the admin settings rather than scattering it throughout the frontend code.

Example environment variable:

`MTN_MOMO_NUMBER=0789630452`

Example USSD configuration:

`MTN_MOMO_USSD=*182*1*1*0789630452#`

The administrator should eventually be able to change the recipient number without modifying frontend source code.

---

# 16. ADMIN DASHBOARD

Create a professional dashboard with:

## Dashboard overview

Show:

- Requests today
- Requests this event
- Songs played
- Pending requests
- Total tips (only if payment verification/integration is available)
- Active event

## Live Requests

The main dashboard screen.

Display incoming requests in real time.

Include:

- Song
- Artist
- Time requested
- Status
- Actions

Newest requests should appear at the top.

## Request History

Allow filtering by:

- Date
- Event
- Status
- Song
- Artist

## Events

DJ can:

- Create event
- Edit event
- Activate event
- Deactivate event
- Delete event
- Generate QR code
- Download QR code
- View event requests

## Blog Management

CRUD functionality:

- Create post
- Edit post
- Delete post
- Publish/unpublish
- Upload featured image

## Profile Management

Allow DJ to edit:

- Name
- Logo
- Profile photo
- Bio
- Tagline
- Social links
- Contact details
- Location

## Tip Settings

Allow the DJ/admin to configure:

- MTN Mobile Money number
- Currency
- USSD code
- Suggested tip amounts for display if desired

Never expose secret credentials in frontend code.

---

# 17. AUTHENTICATION

Admin/DJ dashboard must be protected.

Implement:

- Login
- Secure password hashing
- JWT or secure session authentication
- Protected API routes
- Role-based authorization
- Logout
- Token/session expiration

Guests requesting songs should NOT need authentication.

---

# 18. ANTI-SPAM PROTECTION

Because the request page is public, implement basic protection.

Examples:

- Rate limiting
- Request cooldown
- Input validation
- Maximum request length
- IP/device-based abuse protection where appropriate
- CAPTCHA or bot protection if needed

Do not make the system annoying for normal guests.

The goal is:

**fast for humans, difficult for bots.**

---

# 19. UX REQUIREMENTS

The guest experience must be optimized for:

- iPhone
- Android
- Small screens
- One-handed usage
- Slow mobile networks

The request page should load quickly.

Avoid unnecessary animations.

The user should be able to submit a song in approximately 5–10 seconds.

Use clear feedback:

Loading:

`Sending request...`

Success:

`Request sent!`

Error:

`Something went wrong. Please try again.`

For tipping:

`Opening MTN Mobile Money...`

If USSD cannot be opened:

`Copy the code and dial it from your phone.`

---

# 20. DESIGN DIRECTION

Create a premium DJ/nightlife visual identity.

Use:

- Dark background
- Strong contrast
- Modern typography
- Subtle gradients
- Glass/blur effects where appropriate
- Smooth micro-interactions
- Large touch-friendly buttons
- Premium cards
- Music/nightlife-inspired visual language

Do NOT make it look like a generic SaaS dashboard.

The public website should feel like a DJ brand.

The request page should feel like a dedicated event experience.

The admin dashboard can be more functional and dashboard-oriented.

---

# 21. RESPONSIVE DESIGN

Desktop:

Professional portfolio + full dashboard.

Tablet:

Condensed navigation and cards.

Mobile:

The request interface should be the priority.

The request card should fit naturally within the screen without unnecessary scrolling.

Buttons must be large enough to tap comfortably.

---

# 22. ACCESSIBILITY

Implement:

- Proper labels
- Keyboard navigation
- Focus states
- Accessible buttons
- Good contrast
- Semantic HTML
- Screen-reader-friendly form errors

Do not rely only on color to communicate status.

---

# 23. API STRUCTURE

Create clean REST API endpoints.

Example:

AUTH:

POST `/api/auth/login`

POST `/api/auth/logout`

GET `/api/auth/me`

REQUESTS:

POST `/api/requests`

GET `/api/requests`

PATCH `/api/requests/:id/status`

DELETE `/api/requests/:id`

EVENTS:

GET `/api/events`

POST `/api/events`

GET `/api/events/:id`

PATCH `/api/events/:id`

DELETE `/api/events/:id`

QR:

GET `/api/events/:id/qr`

TIPS:

GET `/api/tips`

PROFILE:

GET `/api/dj/profile`

PATCH `/api/dj/profile`

BLOG:

GET `/api/blog`

GET `/api/blog/:slug`

POST `/api/blog`

PATCH `/api/blog/:id`

DELETE `/api/blog/:id`

---

# 24. WEBSOCKET EVENTS

Implement clear Socket.IO events.

Guest submits request:

`request:created`

Server broadcasts to the appropriate DJ/event room.

DJ dashboard receives:

`request:new`

When DJ changes status:

`request:updated`

Dashboard updates immediately.

Use event-specific rooms so requests are only delivered to the correct DJ/event.

---

# 25. SECURITY

Implement production-level security practices.

Include:

- Environment variables
- Password hashing
- JWT/session security
- CORS configuration
- Rate limiting
- Input sanitization
- SQL injection protection through ORM/parameterized queries
- Secure HTTP headers
- Authentication middleware
- Authorization middleware
- Never expose secrets in frontend code

Create `.env.example`.

Example:

`DATABASE_URL=`

`JWT_SECRET=`

`FRONTEND_URL=`

`BACKEND_URL=`

`MTN_MOMO_NUMBER=0789630452`

`MTN_MOMO_USSD=*182*1*1*0789630452#`

---

# 26. PROJECT STRUCTURE

Keep the project modular and maintainable.

Suggested structure:

frontend/

src/

components/

pages/

layouts/

features/

auth/

requests/

events/

tips/

blog/

profile/

services/

hooks/

utils/

backend/

src/

controllers/

routes/

services/

models/

middleware/

sockets/

utils/

config/

database/

---

# 27. IMPORTANT PRODUCT BEHAVIOR

The system must distinguish between:

### Website visitor

Can browse:

- Home
- About
- Portfolio
- Blog
- Contact

### Guest

Scans QR and accesses:

`/request/...`

Can:

- Submit song request
- Donate tip through MTN Mobile Money

No login.

### DJ

Logs into:

`/admin`

Can manage:

- Live requests
- Events
- QR codes
- Blog
- Profile
- Request history
- Tip settings

---

# 28. REQUEST PAGE BRANDING

The request page should dynamically load the correct DJ/event information.

For example:

DJ logo

**DJ VAXINO**

`What should I play next?`

[ Song Name ]

[ Artist Name (optional) ]

[ REQUEST ]

[ DONATE A TIP ]

The page must change automatically depending on the QR code/event.

---

# 29. EMPTY STATES

Create useful empty states.

No requests:

> No song requests yet.
> New requests will appear here automatically.

No active event:

> No active event.
> Create or activate an event to start receiving requests.

No blog posts:

> No posts published yet.

---

# 30. ERROR HANDLING

Create friendly error handling throughout the application.

Examples:

Network error:

> Connection lost. Trying to reconnect...

Server error:

> We couldn't process your request. Please try again.

Invalid song:

> Please enter a song name.

Expired event:

> This event is no longer accepting requests.

USSD fallback:

> Your device couldn't open the MTN Mobile Money dialer. Copy the code and dial it from your phone.

---

# 31. REAL-TIME CONNECTION STATUS

The DJ dashboard should show connection status.

Example:

🟢 Live

or

🔴 Reconnecting...

If the WebSocket disconnects, automatically reconnect.

Do not silently fail.

---

# 32. PERFORMANCE

Optimize for real-world mobile networks.

Requirements:

- Lazy load images
- Compress images
- Minimize JavaScript
- Optimize API responses
- Use database indexes
- Paginate request history
- Avoid unnecessary API calls
- Use WebSockets for live updates

The public QR request page should be extremely lightweight.

---

# 33. SEO

Implement SEO for the public DJ website.

Include:

- Page titles
- Meta descriptions
- Open Graph metadata
- Twitter/X metadata
- Semantic HTML
- Clean URLs
- Sitemap
- Robots configuration

Do NOT prioritize SEO on the private request page over speed.

---

# 34. ANALYTICS

Prepare the architecture for analytics.

Track:

- Number of requests
- Requests per event
- Popular songs
- Popular artists
- Request submission times
- Tips where verifiable
- Events

The DJ should eventually be able to see statistics such as:

`Most requested songs`

`Requests per event`

`Requests per hour`

Do not expose private analytics publicly.

---

# 35. FUTURE-READY ARCHITECTURE

Design the application so it can eventually support multiple DJs.

Do NOT assume only one DJ.

Future structure:

Platform

→ DJs

→ Events

→ Guests

→ Requests

→ Tips

→ Blog

Each DJ should only have access to their own data.

---

# 36. SEED DATA

Create realistic development seed data.

Include:

- One DJ
- One admin account
- Several events
- Several sample song requests
- Sample blog posts

Clearly document the development login credentials.

Never use weak/default credentials in production.

---

# 37. DEVELOPMENT PRIORITY

Build in this order:

## PHASE 1 — Foundation

- Project setup
- Database
- Authentication
- DJ model
- Event model

## PHASE 2 — Core Request System

- Request page
- Song form
- API
- PostgreSQL storage
- Real-time WebSocket communication

## PHASE 3 — DJ Dashboard

- Live queue
- Request status
- Timers
- Notifications
- Request history

## PHASE 4 — QR/Event System

- Event creation
- Event activation
- Unique request URLs
- QR generation/download

## PHASE 5 — MTN Mobile Money Tipping

- MTN tip button
- USSD deep-link attempt
- Mobile fallback
- Desktop fallback
- Copy USSD code
- Configurable MTN number
- Do not collect PIN
- Do not fake payment verification

## PHASE 6 — Portfolio

- Home
- About
- Events
- Blog
- Contact

## PHASE 7 — Admin CMS

- Profile management
- Blog management
- Event management
- QR management
- Tip settings

## PHASE 8 — Security & Production

- Validation
- Rate limiting
- Authentication hardening
- Error handling
- Environment configuration
- Performance optimization
- Production deployment preparation

---

# 38. MOST IMPORTANT RULE

Do NOT overcomplicate the guest experience.

The entire QR flow should essentially be:

SCAN QR

↓

SEE DJ LOGO

↓

ENTER SONG

↓

OPTIONALLY ENTER ARTIST

↓

PRESS REQUEST

↓

REQUEST REACHES DJ IN REAL TIME

↓

GUEST CAN OPTIONALLY TAP DONATE A TIP

↓

MTN MOBILE MONEY USSD FLOW OPENS

The DJ experience should be:

LOGIN

↓

SELECT/CREATE EVENT

↓

GENERATE QR

↓

DISPLAY QR AT EVENT

↓

RECEIVE REQUESTS LIVE

↓

PLAY SONG

↓

MARK AS PLAYED

The product should feel **fast, premium, reliable, and effortless**.

Build it as a real product that could eventually be offered to multiple DJs, clubs, event organizers, and venues—not as a one-off static website.
