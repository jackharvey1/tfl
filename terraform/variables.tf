variable "tags" {
    description = "Project tags"
    type        = "map"
}

variable "hosted_zone_id" {
    description = "ID of the hosted zone"
    type        = "string"
}

variable "domain" {
    description = "Root domain"
    type        = "string"
}
