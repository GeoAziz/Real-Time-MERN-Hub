# Vault Kubernetes Auth Bootstrap

This folder contains manifests to bootstrap the Vault policy and Kubernetes auth role used by the app injector annotations.

## Prerequisites

- Vault is installed and Kubernetes auth is enabled at `auth/kubernetes`.
- Vault injector webhook is installed in the cluster.
- You have a temporary admin token for bootstrapping.

## Steps

1. Create a real bootstrap secret from `vault-bootstrap-secret.example.yaml`.
2. Apply policy config and bootstrap secret:

```bash
kubectl apply -f k8s/vault/vault-policy-configmap.yaml
kubectl apply -f k8s/vault/vault-bootstrap-secret.yaml
```

3. Run the bootstrap job:

```bash
kubectl apply -f k8s/vault/vault-bootstrap-job.yaml
kubectl -n vault logs job/mern-chatapp-vault-bootstrap
```

4. Delete bootstrap artifacts after success:

```bash
kubectl -n vault delete job mern-chatapp-vault-bootstrap
kubectl -n vault delete secret vault-bootstrap
```
