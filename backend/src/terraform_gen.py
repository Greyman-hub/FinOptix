"""Terraform generation: fill in a provider-specific template with the
recommended instance type."""

TERRAFORM_TEMPLATES = {
    "Azure": '''resource "azurerm_linux_virtual_machine" "{resource_name}" {{
  name                = "{resource_name}"
  resource_group_name = var.resource_group_name
  location            = var.location
  size                = "{instance_type}"
  admin_username      = var.admin_username

  # NOTE: fill in network_interface_ids, os_disk, source_image_reference, etc.
  # for your actual environment before applying.
}}''',
    "GCP": '''resource "google_compute_instance" "{resource_name}" {{
  name         = "{resource_name}"
  machine_type = "{instance_type}"
  zone         = var.zone

  boot_disk {{
    initialize_params {{
      image = var.boot_image
    }}
  }}

  network_interface {{
    network = var.network
  }}
}}''',
    "Alibaba": '''resource "alicloud_instance" "{resource_name}" {{
  instance_name        = "{resource_name}"
  instance_type        = "{instance_type}"
  availability_zone    = var.availability_zone
  image_id             = var.image_id
  security_groups      = var.security_group_ids
  vswitch_id           = var.vswitch_id
}}''',
}


def generate_terraform(provider: str, resource_name: str, instance_type: str) -> str:
    template = TERRAFORM_TEMPLATES.get(provider)
    if template is None:
        return "# No Terraform template available for this provider."
    safe_name = resource_name.lower().replace(" ", "_").replace(":", "_")
    return template.format(resource_name=safe_name, instance_type=instance_type)