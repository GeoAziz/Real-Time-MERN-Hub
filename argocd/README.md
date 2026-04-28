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
