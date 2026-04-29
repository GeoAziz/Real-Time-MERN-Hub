#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bootstrap-argocd-github-secrets.sh --repo OWNER/REPO [--server HOST[:PORT]] [--namespace argocd]

What it does:
- Reads the ArgoCD admin password from the k3s cluster
- Port-forwards the ArgoCD server for local verification
- Logs in with the admin account and generates an auth token
- Adds ARGOCD_SERVER and ARGOCD_AUTH_TOKEN to GitHub repository secrets
- Verifies the token locally by logging in through the port-forward

Options:
  --repo        GitHub repository in OWNER/REPO form. Falls back to gh repo view if omitted.
  --server      Public ArgoCD host reachable by GitHub Actions. Falls back to ingress/LB discovery or interactive prompt.
  --namespace   ArgoCD namespace. Default: argocd
  --help        Show this message
EOF
}

repo=""
server=""
namespace="argocd"
port_forward_port="8080"

prompt_for_value() {
  local prompt_text="$1"
  local prompt_value=""
  read -r -p "$prompt_text" prompt_value
  printf '%s' "$prompt_value"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      repo="${2:-}"
      shift 2
      ;;
    --server)
      server="${2:-}"
      shift 2
      ;;
    --namespace)
      namespace="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh is required" >&2
  exit 1
fi

if ! command -v argocd >/dev/null 2>&1; then
  echo "argocd CLI is required. Install it first or add it to PATH." >&2
  exit 1
fi

if [[ -z "$repo" ]]; then
  if gh repo view >/dev/null 2>&1; then
    repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
  else
    repo="$(git remote get-url origin | sed -E 's#git@github.com:##; s#https://github.com/##; s#\.git$##')"
  fi
fi

if [[ -z "$repo" ]]; then
  echo "Unable to determine GitHub repository. Pass --repo OWNER/REPO." >&2
  exit 1
fi

if [[ -z "$server" ]]; then
  server="$(kubectl -n "$namespace" get ingress -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null || true)"
fi

if [[ -z "$server" ]]; then
  server="$(kubectl -n "$namespace" get svc -o jsonpath='{range .items[?(@.spec.type=="LoadBalancer")]}{.status.loadBalancer.ingress[0].hostname}{.status.loadBalancer.ingress[0].ip}{"\n"}{end}' 2>/dev/null | head -n1 || true)"
fi

if [[ -z "$server" ]]; then
  echo "No public ArgoCD endpoint was discovered in k3s." >&2
  echo "This cluster currently exposes argocd-server as ClusterIP only, so GitHub Actions cannot reach it yet." >&2
  server="$(prompt_for_value 'Enter the public ArgoCD host to store in GitHub Secrets (for example argocd.example.com): ')"
fi

if [[ -z "$server" ]]; then
  echo "ARGOCD_SERVER cannot be empty" >&2
  exit 1
fi

if [[ "$server" == localhost:* || "$server" == 127.0.0.1:* ]]; then
  echo "Warning: $server is only valid for local verification, not for GitHub-hosted Actions." >&2
fi

admin_password="$(kubectl -n "$namespace" get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d)"
if [[ -z "$admin_password" ]]; then
  echo "Unable to read argocd-initial-admin-secret password" >&2
  exit 1
fi

port_forward_log="$(mktemp)"
cleanup() {
  if [[ -n "${pf_pid:-}" ]] && kill -0 "$pf_pid" >/dev/null 2>&1; then
    kill "$pf_pid" >/dev/null 2>&1 || true
    wait "$pf_pid" >/dev/null 2>&1 || true
  fi
  rm -f "$port_forward_log"
}
trap cleanup EXIT

kubectl -n "$namespace" port-forward svc/argocd-server "${port_forward_port}:443" >"$port_forward_log" 2>&1 &
pf_pid=$!

for _ in {1..30}; do
  if grep -q 'Forwarding from 127.0.0.1' "$port_forward_log"; then
    break
  fi
  sleep 1
done

if ! grep -q 'Forwarding from 127.0.0.1' "$port_forward_log"; then
  echo "Port-forward did not become ready:" >&2
  cat "$port_forward_log" >&2
  exit 1
fi

local_argocd_server="localhost:${port_forward_port}"

echo "Logging in locally through $local_argocd_server to generate a token..."
argocd login "$local_argocd_server" --username admin --password "$admin_password" --insecure --grpc-web >/dev/null

auth_token="$(argocd account generate-token --account admin --grpc-web)"
if [[ -z "$auth_token" ]]; then
  echo "Failed to generate an ArgoCD auth token" >&2
  exit 1
fi

printf 'Setting GitHub secrets for %s...\n' "$repo"
printf '%s' "$server" | gh secret set ARGOCD_SERVER --repo "$repo"
printf '%s' "$auth_token" | gh secret set ARGOCD_AUTH_TOKEN --repo "$repo"

printf 'Verifying GitHub secret names exist...\n'
gh secret list --repo "$repo" | grep -E '^ARGOCD_(SERVER|AUTH_TOKEN)\b'

echo "Verifying token by logging in again through the local port-forward..."
argocd login "$local_argocd_server" --username admin --auth-token "$auth_token" --insecure --grpc-web >/dev/null

cat <<EOF
Done.

GitHub secrets set:
- ARGOCD_SERVER=$server
- ARGOCD_AUTH_TOKEN=(generated token)

Note:
- The GitHub-hosted Actions runner must be able to reach ARGOCD_SERVER.
- If ARGOCD_SERVER is localhost or a private cluster address, the workflow will still fail from GitHub Actions.
EOF
