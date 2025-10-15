output "backend_url" {
  value = azurerm_linux_web_app.backend.default_hostname
}

output "frontend_token" {
  value     = azurerm_static_web_app.frontend.api_key
  sensitive = true
}

output "cosmosdb_endpoint" {
  value = azurerm_cosmosdb_account.db_account.endpoint
}

output "cosmosdb_primary_key" {
  value = azurerm_cosmosdb_account.db_account.primary_key
}
