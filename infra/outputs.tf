output "acr_login_server" {
  description = "Container Registry URL (used when pushing images)"
  value       = azurerm_container_registry.acr.login_server
}

output "container_app_url" {
  description = "Default HTTPS URL for the app (before custom domain is set up)"
  value       = "https://${azurerm_container_app.app.ingress[0].fqdn}"
}

output "cloudflare_cname_target" {
  description = "Add a CNAME record in Cloudflare pointing worktasks.net → this value"
  value       = azurerm_container_app.app.ingress[0].fqdn
}
