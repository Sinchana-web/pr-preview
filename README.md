# Cloud-Native PR Preview Platform with React Dashboard

A cloud-native DevOps project that automatically builds, deploys, and provides preview environments for application changes.

The project combines GitHub Actions, Docker, Amazon ECR, Kubernetes, Helm, and a React dashboard to demonstrate a complete CI/CD workflow.

## Project Overview

The platform creates an isolated preview environment for a Pull Request.

When application changes are pushed:

1. GitHub Actions builds the application.
2. A Docker image is created.
3. The image is pushed to Amazon ECR.
4. Helm deploys the application to Kubernetes.
5. A separate namespace is used for the preview environment.
6. The React dashboard displays deployment and Kubernetes information.
7. The preview application can be accessed through a public URL using ngrok.

## Architecture

```text
Developer
    |
    v
GitHub Repository
    |
    v
GitHub Actions
    |
    +----> Docker Build
    |
    v
Amazon ECR
    |
    v
Helm
    |
    v
Kubernetes Cluster
    |
    +----> Preview Namespace
    |
    +----> Application Pod
    |
    v
Service
    |
    v
Port Forwarding
    |
    v
ngrok
    |
    v
Public Preview URL


React Dashboard
    |
    +----> Deployment Status
    +----> Pull Request Information
    +----> Kubernetes Resources
    +----> ECR Image Information
    +----> CI/CD Pipeline Status
