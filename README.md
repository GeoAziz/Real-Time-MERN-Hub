

# Realtime Chat Application



A realtime chat application built using the MERN (MongoDB, Express, React, Node.js) stack. Enables instant messaging between users with Socket.IO.

## Features

- ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) 
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Zustand](https://img.shields.io/badge/Zustand-%237764AD.svg?style=for-the-badge&logo=zustand&logoColor=white)

- MERN Stack: Utilized MongoDB, Express, React, and Node.js for full-stack development.
  
- Secure Backend: Built a robust backend with Node.js and Express, providing RESTful APIs for user authentication and message handling.

- Efficient State Management: Implemented custom React hooks and Zustand for streamlined state management in the frontend.

- Real-Time Communication: Leveraged Socket.IO for real-time communication between users, enabling instant messaging functionality.

- Protected Routes: Incorporated protected routing to ensure secure access to application features.

- Modern UI Design: Styled the application with Tailwind CSS for a modern and responsive user interface.

## Current Direction

This repository is being upgraded from a demo into a production-oriented portfolio project with:

- Runtime-driven configuration via `.env` and Kubernetes/Vault-friendly env injection.
- Cursor-based message pagination.
- Route-level error boundaries and skeleton loaders.
- Typing indicators, delivery/read receipts, and browser notifications.
- Rate limiting and XSS sanitization on the API and client render path.
- Kubernetes, ArgoCD, Vault, Prometheus/Grafana, and Loki scaffolding under `k8s/`, `.github/workflows/`, `monitoring/`, and `load-tests/`.

## Try It Out

You can try out the current Realtime Chat Application [here](https://mern-chatapp-rfj5.onrender.com/).

## Local Development

1. Copy `.env.example` to `.env` and fill in the required values.
2. Install dependencies with `npm install` and `npm install --prefix client`.
3. Start the backend with `npm run server`.
4. Start the frontend with `npm run dev --prefix client`.

## Production Notes

- The runtime container is built from the multi-stage `Dockerfile`.
- Health probes use `GET /api/health`.
- Vault injector annotations are configured on the Deployment and the startup command sources `/vault/secrets/env` when present.
- Kubernetes manifests are split into `k8s/base` and environment overlays in `k8s/overlays/dev` and `k8s/overlays/prod`.
- ArgoCD manifests are available under `argocd/` (`project`, `app-dev`, `app-prod`).
- Vault bootstrap manifests and runbook are under `k8s/vault/`.

## Portfolio Checklist

- [ ] Architecture diagram exported from Excalidraw
- [ ] Grafana dashboard screenshot during load test
- [ ] ArgoCD sync status screenshot
- [ ] k6 load test output showing HPA scaling
- [ ] GitHub Actions green badge
- [ ] Live HTTPS demo URL
