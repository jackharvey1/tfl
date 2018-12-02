output "public_dns" {
    value = "${aws_instance.ec2.public_dns}"
}

output "public_ip" {
    value = "${aws_instance.ec2.public_ip}"
}

output "tenancy" {
    value = "${aws_instance.ec2.tenancy}"
}
