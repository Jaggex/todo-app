variable "location" {
  description = "Azure region"
  type        = string
  default     = "northeurope"
}

variable "app_name" {
  description = "Name prefix used for all resources"
  type        = string
  default     = "worktasks"
}

variable "acr_name" {
  description = "Container Registry name (globally unique, alphanumeric only)"
  type        = string
  default     = "worktasksregistry"
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "nextauth_secret" {
  description = "NextAuth secret key (generate with: openssl rand -base64 32)"
  type        = string
  sensitive   = true
}

variable "nextauth_url" {
  description = "Public URL of the app (used by NextAuth for redirects)"
  type        = string
  default     = "https://worktasks.fi"
}

variable "mongodb_uri" {
  description = "MongoDB Atlas connection string"
  type        = string
  sensitive   = true
}

variable "mongodb_db_name" {
  description = "MongoDB database name"
  type        = string
}

variable "smtp_host" {
  description = "SMTP host for outbound email (e.g. smtp.gmail.com)"
  type        = string
}

variable "smtp_port" {
  description = "SMTP port"
  type        = string
  default     = "587"
}

variable "smtp_user" {
  description = "SMTP username / Gmail address"
  type        = string
  sensitive   = true
}

variable "smtp_pass" {
  description = "SMTP password / Gmail app password"
  type        = string
  sensitive   = true
}

variable "email_from" {
  description = "From address shown on outgoing emails"
  type        = string
}
