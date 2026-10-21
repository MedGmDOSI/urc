# UBO Relay Chat — Réalisation

## Lancer le projet

```bash
npm install
npx vercel link
npx vercel env pull .env.development.local
npx vercel dev
```

Variables d'environnement nécessaires : voir [.env.example](.env.example).
Sur Vercel, il faut connecter 3 stores au projet (Neon, Upstash KV, **Blob**) et ajouter les variables Pusher
(`PUSHER_INSTANCE_ID`, `PUSHER_SECRET_KEY`, `VITE_PUSHER_INSTANCE_ID`).
Sans `VITE_PUSHER_INSTANCE_ID`, l'application se rabat sur un rafraîchissement périodique (10 s).

## Choix techniques

| Sujet | Choix |
|---|---|
| Store | Zustand (`src/store`) — session persistée en sessionStorage |
| Routage | React Router : `/login`, `/register`, `/messages`, `/messages/user/:id`, `/messages/room/:id` |
| UI | MUI (thème clair / sombre selon le système) |
| Messages | Redis : une liste par conversation (`LPUSH`, expiration 24 h) |
| Images | Vercel Blob (`/api/upload`) |
| Notifications | Pusher Beams + service worker |

Clés Redis :

- `conv:user:<min>:<max>` : conversation privée (ids triés, donc identique pour les 2 participants)
- `conv:room:<room_id>` : messages d'un salon
- `unread:<user_id>` : hash des compteurs de messages non lus (`user:<id>` / `room:<id>`)

## Services API

| Service | Runtime | Rôle |
|---|---|---|
| `POST /api/login` | Edge | Connexion, retourne le token de session |
| `POST /api/register` | Edge | Inscription (contrôles, hash, external_id) puis connexion automatique |
| `POST /api/logout` | Edge | Supprime la session en cache |
| `GET /api/users` | Edge | Liste des utilisateurs (données publiques) |
| `GET/POST /api/rooms` | Edge | Liste / création de salons |
| `GET /api/messages?type=user\|room&id=X` | Edge | Messages d'une conversation (la marque comme lue) |
| `POST /api/message` | Serverless | Enregistre un message + notification push aux destinataires |
| `GET /api/unread` | Edge | Compteurs de non-lus |
| `POST /api/upload` | Edge | Envoi d'une image (PNG, JPEG, GIF, WEBP — 4 Mo max) |
| `GET /api/beams` | Serverless | Token Pusher Beams de l'utilisateur |

## Fonctionnalités

- Connexion, inscription (avec connexion automatique), déconnexion
- Pages protégées, retour à la conversation demandée après connexion
- Liste des utilisateurs (sans l'utilisateur connecté) avec date de dernière connexion, recherche
- Conversation sélectionnée dans l'URL (F5, favoris, deep link des notifications)
- Messages privés et salons, affichage type conversation, auto-scroll
- Notifications push (utilisateur ou tous les membres d'un salon) et rafraîchissement via le service worker
- Envoi d'images / GIF
- Compteurs de messages non lus
- Création dynamique de salons
- Affichage adapté au mobile
