output "acr_login_server" {
  description = "Container Registry URL (used when pushing images)"
  value       = azurerm_container_registry.acr.login_server
}

output "container_app_url" {
  description = "Default HTTPS URL for the app (before custom domain is set up)"
  value       = "https://${azurerm_container_app.app.ingress[0].fqdn}"
}

output "dns_nameservers" {
  description = "Azure DNS nameservers — paste these into your registrar's nameserver settings for worktasks.fi"
  value       = azurerm_dns_zone.dns.name_servers
}
