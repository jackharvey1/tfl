provider "aws" {
    region  = "eu-west-2"
    profile = "personal"
}

data "aws_ami" "ec2_ami" {
    most_recent = true

    filter {
        name   = "owner-alias"
        values = ["amazon"]
    }


    filter {
        name   = "name"
        values = ["amzn2-ami-hvm*"]
    }

    tags                    = "${var.tags}"
}

resource "aws_key_pair" "ssh" {
    key_name   = "default"
    public_key = "${file("~/.ssh/id_rsa.pub")}"
}

resource "aws_instance" "ec2" {
    ami                    = "${data.aws_ami.ec2_ami.id}"
    instance_type          = "t2.micro"
    vpc_security_group_ids = [ "${aws_security_group.allow_http.id}" ]

    key_name                = "${aws_key_pair.ssh.id}"
    user_data               = "${file("./.init.sh")}"

    tags                    = "${var.tags}"
}

resource "aws_security_group" "allow_http" {
  name        = "allow_all"
  description = "Allow all inbound http(s) traffic"

    ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port        = 0
    to_port          = 65535
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = "${var.tags}"
}

resource "aws_route53_record" "tfl" {
  zone_id = "${var.hosted_zone_id}"
  name    = "tfl.${var.domain}"
  type    = "A"
  ttl     = "300"
  records = ["${aws_instance.ec2.public_ip}"]
}
