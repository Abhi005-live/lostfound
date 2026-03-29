# Lost & Found Portal

A full-stack web application where users can report lost or found items and browse listings posted by others.

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 19, Vite, React Router, Axios |
| Backend  | Spring Boot 3.2, Spring Data JPA    |
| Database | H2 (in-memory)                      |
| Build    | Maven                               |

---

## Project Structure

```
lostofound/
├── frontend/         # React app (Vite)
└── backend/          # Spring Boot app (Maven)
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Java 17+
- Maven

---

### Run the Backend

```bash
cd backend
./mvnw spring-boot:run
```

Runs on `http://localhost:8080`

H2 console available at `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:lostfounddb`
- Username: `sa`
- Password: *(leave blank)*

---

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`

---

## Frontend

### Pages

| Route           | Page          | Description                                      |
|-----------------|---------------|--------------------------------------------------|
| `/`             | Login         | Login with username and password                 |
| `/register`     | Register      | Create a new account                             |
| `/dashboard`    | Dashboard     | Browse all lost & found items with search/filter |
| `/report-lost`  | Report Lost   | Submit a lost item report                        |
| `/report-found` | Report Found  | Submit a found item report                       |
| `/item/:id`     | Item Details  | View full details of a specific item             |

### Components

**`Navbar`** — Top navigation bar with links to Dashboard, Report Lost, and Report Found.

**`ItemCard`** — Card component used in the Dashboard grid. Displays item image, title, description, location, date, and a "View Details" button linking to `/item/:id`.

### Services

**`src/services/api.js`** — Axios instance configured with:
- Base URL: `http://localhost:8080/api`
- Request interceptor: reads the logged-in user from `localStorage` and attaches their ID as the `X-User-Id` header on every request

### State & Auth

- On successful login, the user object `{ id, username }` is stored in `localStorage` under the key `"user"`
- No token-based auth — user ID is passed via header for identification
- Navigating to protected pages without logging in is not blocked by a route guard (can be added later)

---

## Backend

### Package Structure

```
src/main/java/lostofound/
├── config/
│   └── CorsConfig.java
├── controller/
│   ├── AuthController.java
│   └── ItemController.java
├── entity/
│   ├── User.java
│   └── Item.java
├── repository/
│   ├── UserRepository.java
│   └── ItemRepository.java
├── service/
│   ├── UserService.java
│   └── ItemService.java
└── lostFoundApplication.java
```

---

### API Endpoints

#### Auth — `/api/auth`

| Method | Endpoint             | Body                          | Response                                      |
|--------|----------------------|-------------------------------|-----------------------------------------------|
| POST   | `/api/auth/register` | `{ username, password }`      | `{ message, id }` or `400 { error }`         |
| POST   | `/api/auth/login`    | `{ username, password }`      | `{ message, id, username }` or `401 { error }` |

**Register errors:** returns `400` if username already exists.  
**Login errors:** returns `401` if credentials are invalid.

---

#### Items — `/api/items`

| Method | Endpoint         | Params / Body                                      | Response              |
|--------|------------------|----------------------------------------------------|-----------------------|
| GET    | `/api/items`     | `?search=` (optional), `?type=lost\|found` (optional) | `[ Item, ... ]`    |
| GET    | `/api/items/{id}`| —                                                  | `Item` or `404`       |
| POST   | `/api/items`     | `{ title, description, location, type, image }`    | `Item` or `400`       |

**POST validation:**
- `title` is required
- `type` must be exactly `"lost"` or `"found"`
- `date` is auto-set to today if not provided

---

### Entities

#### User

| Field    | Type   | Notes           |
|----------|--------|-----------------|
| id       | Long   | Auto-generated  |
| username | String | Unique          |
| password | String | Plain text (no hashing — for development only) |

#### Item

| Field       | Type   | Notes                              |
|-------------|--------|------------------------------------|
| id          | Long   | Auto-generated                     |
| title       | String | Required                           |
| description | String | Optional                           |
| location    | String | Where it was lost/found            |
| date        | String | Auto-set to today if not provided  |
| type        | String | `"lost"` or `"found"`              |
| image       | String | URL string (optional)              |

---

### CORS

Configured in `CorsConfig.java` to allow requests from `http://localhost:5173` on all `/api/**` routes with methods `GET`, `POST`, `PUT`, `DELETE`.

---

## Data Flow Examples

### User registers and logs in
```
Register page  →  POST /api/auth/register  →  User saved to H2
Login page     →  POST /api/auth/login     →  Returns user object  →  Stored in localStorage
```

### User reports a lost item
```
Report Lost page  →  POST /api/items  { title, location, type: "lost" }
                  →  Item saved with today's date auto-set
                  →  Redirects to Dashboard
```

### Dashboard loads and filters
```
Dashboard mounts  →  GET /api/items               →  All items displayed
User types search →  GET /api/items?search=wallet  →  Filtered results
User picks "lost" →  GET /api/items?type=lost      →  Only lost items
Both combined     →  GET /api/items?search=wallet&type=lost
```

### User views item details
```
Clicks "View Details"  →  Navigates to /item/3
ItemDetails mounts     →  GET /api/items/3  →  Full item displayed
```

---

## Known Limitations

- Passwords are stored as plain text — add BCrypt hashing before any real deployment
- No JWT or session-based auth — the `X-User-Id` header is not verified server-side
- Images are stored as URL strings — no file upload support
- H2 is in-memory — all data is lost on server restart (`create-drop` mode)
