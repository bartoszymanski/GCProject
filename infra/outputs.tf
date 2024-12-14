output "cloud_run_url" {
  description = "The URL of the Cloud Run service"
  value       = google_cloud_run_service.cloud-run-tf.status[0].url
}

output "cloud_function_url" {
  description = "The URL of the Cloud Function"
  value       = google_cloudfunctions_function.daily_email_function.https_trigger_url
}