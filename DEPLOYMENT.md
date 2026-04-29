# Deployment Architecture & Setup Guide

## Overview

This project uses **ArgoCD** for continuous deployment to a local **k3s Kubernetes cluster**. The CD pipeline is defined in `.github/workflows/cd.yml` and syncs two ArgoCD applications:
- `mern-chatapp-dev` (dev environment)
- `mern-chatapp-prod` (prod environment)

## Current Setup ✅

### Infrastructure
- **Kubernetes**: k3s running locally at `default` context
- **Ingress Controller**: Traefik (LoadBalancer at `192.168.0.116`)
- **ArgoCD**: Running in `argocd` namespace
  - Exposed via Traefik ingress: `argocd.192.168.0.116.nip.io`
  - Service account: `github-actions` with sync permissions

### GitHub Secrets Configured
- `ARGOCD_SERVER`: `argocd.192.168.0.116.nip.io`
- `ARGOCD_AUTH_TOKEN`: Service account token (1-year validity)

### ArgoCD Applications
Both applications exist and are synced:
```bash
kubectl -n argocd get applications
# NAME                SYNC STATUS   HEALTH STATUS
# mern-chatapp-dev    Synced        Progressing
# mern-chatapp-prod   Synced        Progressing
```

---

## The Networking Challenge 🌐

GitHub Actions cloud runners (ubuntu-latest) **cannot reach your local cluster** at `192.168.0.116` because:
- They run in GitHub's cloud infrastructure (isolated network)
- Your k3s cluster is on your local machine
- No VPN or tunnel connects them

### Tested Scenarios
✅ **Local testing works** — Your machine can reach ArgoCD  
✅ **Service account token works** — ArgoCD auth is valid  
✅ **Applications exist** — Both dev/prod apps are configured  
❌ **Cloud runners fail** — Can't reach `192.168.0.116` from GitHub infrastructure

---

## Solutions

### Option 1: Self-Hosted Runner (Recommended for Portfolio)

A self-hosted runner on your local machine can access the k3s cluster directly.

#### Setup Steps

1. **Generate a GitHub token** with `repo` and `admin:org_self_hosted_runner` scopes
2. **Download and register the runner**:
   ```bash
   mkdir ~/github-runner && cd ~/github-runner
   curl -o actions-runner-linux-x64-2.x.x.tar.gz \
     https://github.com/actions/runner/releases/download/vX.X.X/actions-runner-linux-x64-2.X.X.tar.gz
   tar xzf actions-runner-linux-x64-2.X.X.tar.gz
   ./config.sh --url https://github.com/GeoAziz/chat-platform-k8s --token YOUR_TOKEN
   ```
3. **Update the workflow** to use your runner:
   ```yaml
   jobs:
     deploy:
       runs-on: self-hosted  # Change from ubuntu-latest
   ```
4. **Start the runner** (keep it running):
   ```bash
   ./run.sh
   ```

**Advantages:**
- Direct access to k3s cluster
- Production-grade setup
- Great portfolio demonstration
- No firewall/tunnel overhead

**Disadvantages:**
- Runner must stay running
- You maintain the runner environment

---

### Option 2: ngrok Tunnel (Quick Demo)

Expose your local ArgoCD publicly via ngrok, then update GitHub secrets.

#### Setup Steps

1. **Install ngrok**: https://ngrok.com/download
2. **Expose ArgoCD**:
   ```bash
   ngrok http https://localhost:443 --domain=your-domain.ngrok.io
   ```
   (Note: You need a paid ngrok account for static domains)

3. **Update GitHub secrets**:
   ```bash
   gh secret set ARGOCD_SERVER --body "your-domain.ngrok.io" --repo GeoAziz/chat-platform-k8s
   ```

4. **Update workflow** to skip certificate verification:
   ```yaml
   - name: Login to ArgoCD
     run: |
       argocd login "$ARGOCD_SERVER" --auth-token "$ARGOCD_AUTH_TOKEN" \
         --grpc-web --insecure
   ```

**Advantages:**
- No infrastructure setup
- Cloud runners work immediately
- Good for testing/demos

**Disadvantages:**
- ngrok free tier has limitations
- Exposes ArgoCD to public internet
- Domain/URL changes on restart (unless paid)
- SSL verification skipping not ideal

---

### Option 3: Document as Local-Only (for Portfolio)

Include clear documentation explaining the architecture and why cloud runners can't access it.

```yaml
# .github/workflows/cd.yml
jobs:
  deploy:
    runs-on: [self-hosted]  # Explicitly require local runner
```

Add a note in the README:
> "This workflow requires a self-hosted GitHub Actions runner on the local network to access the k3s cluster. Cloud runners (ubuntu-latest) cannot reach local infrastructure."

**Advantages:**
- Realistic production setup
- Demonstrates DevOps knowledge
- No workarounds needed

---

## Local Testing with `act`

You can test the workflow locally using the `act` tool:

```bash
# Install act
./bin/act push \
  -s ARGOCD_SERVER=argocd.192.168.0.116.nip.io \
  -s ARGOCD_AUTH_TOKEN="$(kubectl -n argocd create token github-actions --duration=1h)" \
  -j deploy
```

**Note:** Docker must be running and your local machine must have kubectl access to k3s.

---

## Manual Deployment (Alternative)

If you want to sync apps without the workflow:

```bash
# Login to ArgoCD
argocd login argocd.192.168.0.116.nip.io --auth-token "YOUR_TOKEN" --grpc-web

# Sync apps
argocd app sync mern-chatapp-dev --grpc-web
argocd app wait mern-chatapp-dev --health --sync --timeout 600 --grpc-web

argocd app sync mern-chatapp-prod --grpc-web
argocd app wait mern-chatapp-prod --health --sync --timeout 600 --grpc-web
```

---

## File Inventory

| File | Purpose |
|------|---------|
| `.github/workflows/cd.yml` | GitHub Actions CD pipeline |
| `k8s/argocd-github-actions-sa.yaml` | Service account for GitHub Actions |
| `k8s/argocd-apps.yaml` | ArgoCD Application definitions |
| `argocd/argocd-server-ingress.yaml` | Traefik ingress for ArgoCD UI |
| `scripts/bootstrap-argocd-github-secrets.sh` | Automated secret setup script |

---

## Troubleshooting

**Q: Workflow fails with "connection timed out"**  
A: Cloud runner can't reach local cluster. Use self-hosted runner.

**Q: ArgoCD login fails with "certificate error"**  
A: Self-signed cert from Traefik. Add `--insecure` flag or use ngrok.

**Q: Service account token expired**  
A: Regenerate with `kubectl -n argocd create token github-actions --duration=8760h`

**Q: Can't access ArgoCD UI**  
A: Try `curl -k https://argocd.192.168.0.116.nip.io` to verify ingress is working

---

## Next Steps

1. **Choose your networking approach** (self-hosted runner recommended)
2. **Implement the solution** from the options above
3. **Test the workflow** by pushing to main or manually triggering
4. **Monitor deployment** in ArgoCD UI or CLI:
   ```bash
   argocd app get mern-chatapp-dev --grpc-web
   ```

