variable "project_id" {
  description = "ID of the project"
  type        = string
}

variable "region" {
  description = "Google Cloud region"
  type        = string
}

variable "zone" {
  description = "Google Cloud zone"
  type        = string
}

variable "credentials_file" {
  description = "Path to the Google Cloud credentials JSON file"
  type        = string
}

variable "flask-app-image" {
  description = "Docker image for the Node.js app"
  type        = string
}

variable "database_instance_name" {
  description = "Name of cloud sql instance"
  type        = string
}

variable "db_name" {
  description = "Name of the database"
  type        = string
}

variable "dbuser_pass" {
  description = "Password for the database user"
  type        = string
}

variable "db_username" {
  description = "Username for the database user"
  type        = string
}

variable "function_code" {
  description = "value of the function code"
  type        = string
}

variable "function_path" {
  description = "path to the function code"
  type        = string
}

variable "SendGrid_API_Key" {
  description = "SendGrid API Key"
  type        = string
}

variable "SendGrid_Email" {
  description = "SendGrid Email"
  type        = string
}

variable "project_email" {
  description = "Email of the project"
  type        = string
}

variable "flask_secretkey" {
  description = "Secret key for the Flask app"
  type        = string
}

variable "endpoints" {
  type        = list(string)
  description = "List of endpoints"
}
