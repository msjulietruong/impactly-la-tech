variable "mongodb_uri" {
  type      = string
  sensitive = true
}

variable "redis_url" {
  type      = string
  sensitive = true
}

variable "cache_ttl" {
  type = string
}
