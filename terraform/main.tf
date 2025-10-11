terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.47.0"
    }
  }

  required_version = ">= 1.1.0"
  cloud {
    hostname = "app.terraform.io"
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
    "WEBSITES_PORT" = "3000"
  }
}

resource "azurerm_static_web_app" "frontend" {
  name                = "impactly-frontend"
  resource_group_name = azurerm_resource_group.project.name
  location            = azurerm_resource_group.project.location

  sku_tier = "Free"
}
