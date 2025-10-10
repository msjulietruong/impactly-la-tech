terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0.2"
    }
  }

  backend "azurerm" {}
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "project" {
  name     = "DefaultResourceGroup-CUS"
  location = "North Central US"
}

resource "azurerm_service_plan" "backend_plan" {
  name = "impactly-backend-plan"
  resource_group_name = azurerm_resource_group.project.name
  location = azurerm_resource_group.project.location
  os_type = "Linux"
  sku_name = "Free"
}

resource "azurerm_linux_web_app" "backend" {
  name = "impactly-backend"
  resource_group_name = azurerm_resource_group.project.name
  location = azurerm_resource_group.project.location
  service_plan_id = azurerm_service_plan.project_plan.id

  site_config {
    application_stack {
      node_version = "20-lts"
    }
  }

  app_settings = {
    "WEBSITES_PORT" = "3000"
  }
}

resource "azurerm_static_web_app" "frontend" {
  name = "impactly-frontend"
  resource_group_name = azurerm_resource_group.project.name
  location = azurerm_resource_group.project.location

  sku_tier = "Free"
}
