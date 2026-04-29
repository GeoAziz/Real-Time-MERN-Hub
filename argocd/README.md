# ArgoCD Manifests

Apply these once ArgoCD is installed in your cluster:

```bash
kubectl apply -f argocd/project.yaml
kubectl apply -f argocd/app-dev.yaml
kubectl apply -f argocd/app-prod.yaml
```

Required updates before applying:

- Replace `your-username` in `repoURL` and image names.
- Ensure the `argocd` namespace exists.
- Set repository credentials in ArgoCD for private repositories.

## GitHub Secrets Bootstrap

Use `scripts/bootstrap-argocd-github-secrets.sh` to:

- Read the initial ArgoCD admin password from the k3s cluster.
- Open a temporary port-forward to the ArgoCD server for local verification.
- Generate an ArgoCD admin token.
- Set `ARGOCD_SERVER` and `ARGOCD_AUTH_TOKEN` in GitHub Secrets with `gh`.

Example:

```bash
bash scripts/bootstrap-argocd-github-secrets.sh --repo OWNER/REPO
```

Important:

- `ARGOCD_SERVER` must be reachable from the GitHub Actions runner.
- If your cluster only exposes ArgoCD as `ClusterIP`, the script can still verify locally through port-forwarding, but you must supply a public host for GitHub Actions.
