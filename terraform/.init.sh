#! /bin/bash
# export APP_ID=
# export APP_KEY=
eval $(cat .credentials)

sudo -i

yum install nginx -y

sudo amazon-linux-extras install nginx1.12 -y

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

yum install git -y
git clone https://github.com/jackharvey1/tfl.git

echo "[mongodb-org-4.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2013.03/mongodb-org/4.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.0.asc" > /etc/yum.repos.d/mongodb-org-4.0.repo
yum install -y mongodb-org
service mongod start

cd tfl
nvm install
npm install
npm install -g gulp

cd src
PORT=80 APP_ID=$APP_ID APP_KEY=$APP_KEY gulp


