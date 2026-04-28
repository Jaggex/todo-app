terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  # Uncomment this block later to store state in Azure instead of locally:
  # backend "azurerm" {
  #   resource_group_name  = "worktasks-tfstate-rg"
  #   storage_account_name = "worktaskstfstate"
  #   container_name       = "tfstate"
  #   key                  = "worktasks.tfstate"
  # }
}

provider "azurerm" {
  features {}
}

# ── Resource Group ────────────────────────────────────────────────────────────

resource "azurerm_resource_group" "rg" {
  name     = "${var.app_name}-rg"
  location = var.location
}

# ── Container Registry ────────────────────────────────────────────────────────

resource "azurerm_container_registry" "acr" {
  # Must be globally unique, alphanumeric only, 5–50 chars.
  # Change var.acr_name in tfvars if this name is already taken.
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# ── Log Analytics (required by Container Apps) ────────────────────────────────

resource "azurerm_log_analytics_workspace" "logs" {
  name                = "${var.app_name}-logs"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# ── Container Apps Environment ────────────────────────────────────────────────

resource "azurerm_container_app_environment" "env" {
  name                       = "${var.app_name}-env"
  resource_group_name        = azurerm_resource_group.rg.name
  location                   = azurerm_resource_group.rg.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
}

# ── Container App ─────────────────────────────────────────────────────────────

resource "azurerm_container_app" "app" {
  name                         = "${var.app_name}-app"
  resource_group_name          = azurerm_resource_group.rg.name
  container_app_environment_id = azurerm_container_app_environment.env.id
  revision_mode                = "Single"

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }
  secret {
    name  = "nextauth-secret"
    value = var.nextauth_secret
  }
  secret {
    name  = "mongodb-uri"
    value = var.mongodb_uri
  }
  secret {
    name  = "smtp-user"
    value = var.smtp_user
  }
  secret {
    name  = "smtp-pass"
    value = var.smtp_pass
  }

  template {
    # min_replicas = 0 scales to zero when idle (free, but slow cold start).
    # Set to 1 if you want the app always responsive.
    min_replicas = 0
    max_replicas = 1

    container {
      name   = var.app_name
      image  = "${azurerm_container_registry.acr.login_server}/todo-app:${var.image_tag}"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name        = "NEXTAUTH_SECRET"
        secret_name = "nextauth-secret"
      }
      env {
        name  = "NEXTAUTH_URL"
        value = var.nextauth_url
      }
      env {
        name        = "MONGODB_URI"
        secret_name = "mongodb-uri"
      }
      env {
        name  = "MONGODB_DB_NAME"
        value = var.mongodb_db_name
      }
      env {
        name  = "SMTP_HOST"
        value = var.smtp_host
      }
      env {
        name  = "SMTP_PORT"
        value = var.smtp_port
      }
      env {
        name        = "SMTP_USER"
        secret_name = "smtp-user"
      }
      env {
        name        = "SMTP_PASS"
        secret_name = "smtp-pass"
      }
      env {
        name  = "EMAIL_FROM"
        value = var.email_from
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

# ── DNS Zone ──────────────────────────────────────────────────────────────────
# After apply, copy the name_servers output to your registrar's nameserver settings.

resource "azurerm_dns_zone" "dns" {
  name                = "worktasks.fi"
  resource_group_name = azurerm_resource_group.rg.name
}
