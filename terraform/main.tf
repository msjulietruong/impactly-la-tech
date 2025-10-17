terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.47.0"
    }
  }

  required_version = ">= 1.1.0"
  cloud {
    hostname     = "app.terraform.io"
    organization = "impactly-la-lech"
    workspaces {
      name = "impactly"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "project" {
  name     = "impactly-project"
  location = "West US 2"
}

resource "azurerm_resource_group" "project2" {
  name     = "impactly-backend-project"
  location = "North Central US"
}

resource "azurerm_resource_group" "project3" {
  name     = "impactly-db-project"
  location = "East US 2"
}

resource "azurerm_cosmosdb_account" "db_account" {
  name                = "impactly-db-account"
  location            = azurerm_resource_group.project3.location
  resource_group_name = azurerm_resource_group.project3.name
  offer_type          = "Standard"
  kind                = "MongoDB"

  automatic_failover_enabled = false
  free_tier_enabled = true

  capabilities {
    name = "EnableMongo"
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.project3.location
    failover_priority = 0
  }
}

resource "azurerm_cosmosdb_sql_database" "db" {
  name                = "impactly-db"
  resource_group_name = azurerm_resource_group.project3.name
  account_name        = azurerm_cosmosdb_account.db_account.name
}

resource "azurerm_cosmosdb_sql_container" "container" {
  name                = "items"
  resource_group_name = azurerm_resource_group.project3.name
  account_name        = azurerm_cosmosdb_account.db_account.name
  database_name       = azurerm_cosmosdb_sql_database.db.name
  partition_key_paths  = [ "/id" ]

  indexing_policy {
    indexing_mode = "consistent"
    included_path {
      path = "/*"
    }
    excluded_path {
      path = "/\"_etag\"/?"
    }
  }

  unique_key {
    paths = ["/id"]
  }
}

resource "azurerm_service_plan" "backend_plan" {
  name                = "impactly-backend-plan"
  resource_group_name = azurerm_resource_group.project2.name
  location            = azurerm_resource_group.project2.location
  os_type             = "Linux"
  sku_name            = "F1"
}

resource "azurerm_linux_web_app" "backend" {
  name                = "impactly-backend"
  resource_group_name = azurerm_resource_group.project2.name
  location            = azurerm_resource_group.project2.location
  service_plan_id     = azurerm_service_plan.backend_plan.id

  site_config {
    always_on = false
    application_stack {
      node_version = "20-lts"
    }
  }

  app_settings = {
    "MONGODB_URI"   = var.mongodb_uri
    "WEBSITES_PORT" = "3000"
  }
}

resource "azurerm_static_web_app" "frontend" {
  name                = "impactly-frontend"
  resource_group_name = azurerm_resource_group.project.name
  location            = azurerm_resource_group.project.location

  sku_tier = "Free"
}
